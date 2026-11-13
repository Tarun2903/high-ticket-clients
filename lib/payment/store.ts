// Registration/payment persistence on Upstash Redis – SERVER ONLY.
//
// Keys
//   rzp:reg:{registrationId}   hash  – registration + payment state (see RegistrationRecord)
//   rzp:order:{orderId}        string – registrationId (written by checkout right after the order is created)
//   rzp:key:{sha256(email|phone)} string – registrationId; one registration per person, so retries reuse it
//   rzp:evt:{eventId}          string – webhook dedupe marker ("lock" while processing, "done" afterwards)
//
// Checkout saves the registration (PENDING) BEFORE creating the Razorpay order and calls
// linkOrder() right after, so the webhook/verify routes can always find the registration.
import { Redis } from "@upstash/redis";

export type RegistrationStatus = "PENDING" | "PAID" | "FAILED";

export type RegistrationRecord = {
  registrationId: string;
  status: RegistrationStatus;
  orderId?: string;
  amountPaise: number;
  currency: string;
  paymentId?: string;
  paidAt?: string;
  failureReason?: string;
  purchaseEventId?: string;
  name?: string;
  email?: string;
  phone?: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
  /** JSON of the sanitized UTM/fbclid attribution captured on the landing page. */
  attribution?: string;
  createdAt?: string;
};

export type MarkResult = "missing" | "already_paid" | "paid_now" | "failed";

/** Everything the webhook needs from storage. Injected so the logic can be tested without Redis. */
export interface PaymentStore {
  getRegistration(registrationId: string): Promise<RegistrationRecord | null>;
  findRegistrationIdByOrder(orderId: string): Promise<string | null>;
  /** Atomic: PENDING/FAILED -> PAID. Returns "paid_now" for exactly one caller, "already_paid" for the rest. */
  markPaid(registrationId: string, paymentId: string, paidAtIso: string): Promise<MarkResult>;
  /** Atomic: PENDING -> FAILED. Never downgrades a paid registration ("already_paid" is returned instead). */
  markFailed(registrationId: string, reason: string): Promise<MarkResult>;
  /** Acquire the processing lock for an event. "duplicate" = already processed, "busy" = being processed now. */
  claimEvent(eventId: string): Promise<"claimed" | "duplicate" | "busy">;
  completeEvent(eventId: string): Promise<void>;
  releaseEvent(eventId: string): Promise<void>;
}

const REG = (id: string) => `rzp:reg:${id}`;
const ORDER = (id: string) => `rzp:order:${id}`;
const EVT = (id: string) => `rzp:evt:${id}`;
const KEY = (k: string) => `rzp:key:${k}`;
const LOCK_SECONDS = 60;
const DONE_SECONDS = 60 * 60 * 24 * 7;

const MARK_PAID_LUA = `
local cur = redis.call('HGET', KEYS[1], 'status')
if not cur then return 'missing' end
if cur == 'PAID' then return 'already_paid' end
redis.call('HSET', KEYS[1], 'status', 'PAID', 'paymentId', ARGV[1], 'paidAt', ARGV[2])
redis.call('HDEL', KEYS[1], 'failureReason')
return 'paid_now'
`;

const MARK_FAILED_LUA = `
local cur = redis.call('HGET', KEYS[1], 'status')
if not cur then return 'missing' end
if cur == 'PAID' then return 'already_paid' end
redis.call('HSET', KEYS[1], 'status', 'FAILED', 'failureReason', ARGV[1])
return 'failed'
`;

let client: Redis | null = null;

function redis(): Redis {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN are not set");
  client = new Redis({ url, token, automaticDeserialization: false }); // keep every value a plain string
  return client;
}

export function redisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

// ---- Used by the checkout route -------------------------------------------------------------

/** Writes (or partially updates) a registration hash. Undefined fields are skipped. */
export async function saveRegistration(record: Partial<RegistrationRecord> & { registrationId: string }): Promise<void> {
  const fields: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(record)) if (v !== undefined) fields[k] = v;
  await redis().hset(REG(record.registrationId), fields);
}

/** Atomically reserves the per-person key. true = this caller owns it and should create the registration. */
export async function claimRegistrationKey(key: string, registrationId: string): Promise<boolean> {
  return Boolean(await redis().set(KEY(key), registrationId, { nx: true }));
}

export async function findRegistrationIdByKey(key: string): Promise<string | null> {
  const id = await redis().get<string>(KEY(key));
  return id ? String(id) : null;
}

export async function linkOrder(orderId: string, registrationId: string): Promise<void> {
  await redis().hset(REG(registrationId), { orderId });
  await redis().set(ORDER(orderId), registrationId);
}

// ---- Used by the webhook (and later /api/payments/verify, so both share one paid-transition) --

export const redisPaymentStore: PaymentStore = {
  async getRegistration(registrationId) {
    const h = await redis().hgetall<Record<string, string | number>>(REG(registrationId));
    if (!h || Object.keys(h).length === 0) return null;
    return {
      ...(h as unknown as RegistrationRecord),
      registrationId,
      amountPaise: Number(h.amountPaise),
      
      orderId: h.orderId === undefined ? undefined : String(h.orderId),
      paymentId: h.paymentId === undefined ? undefined : String(h.paymentId),
    };
  },

  async findRegistrationIdByOrder(orderId) {
    const id = await redis().get<string>(ORDER(orderId));
    return id ? String(id) : null;
  },

  async markPaid(registrationId, paymentId, paidAtIso) {
    return (await redis().eval(MARK_PAID_LUA, [REG(registrationId)], [paymentId, paidAtIso])) as MarkResult;
  },

  async markFailed(registrationId, reason) {
    return (await redis().eval(MARK_FAILED_LUA, [REG(registrationId)], [reason.slice(0, 300)])) as MarkResult;
  },

  async claimEvent(eventId) {
    const got = await redis().set(EVT(eventId), "lock", { nx: true, ex: LOCK_SECONDS });
    if (got) return "claimed";
    return (await redis().get<string>(EVT(eventId))) === "done" ? "duplicate" : "busy";
  },

  async completeEvent(eventId) {
    await redis().set(EVT(eventId), "done", { ex: DONE_SECONDS });
  },

  async releaseEvent(eventId) {
    await redis().del(EVT(eventId));
  },
};
