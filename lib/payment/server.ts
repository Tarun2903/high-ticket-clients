// Payment service – SERVER ONLY. Never import this file from a client component.
//
// Flow (see also app/api/checkout, app/api/payments/verify, app/api/razorpay/webhook):
//   1. createCheckoutOrder(): saves a PENDING registration, creates the Razorpay order with the amount
//      taken from lib/workshop.ts (never from the browser) and returns what Checkout needs.
//      One registration per person (email+phone): a retry reuses the same registration and order.
//   2. Browser pays in the Razorpay popup -> POST /api/payments/verify (signature + Razorpay API check).
//   3. Razorpay -> POST /api/razorpay/webhook is the backup if the tab closed before step 2.
//   4. Both 2 and 3 flip PENDING -> PAID through the same atomic store.markPaid(), so it happens once.
//   5. /payment/success only renders for a PAID registration AND a matching signed access cookie.
import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { RegistrationDetails } from "@/lib/registration";
import type { Attribution } from "@/lib/tracking/attribution";
import { workshop } from "@/lib/workshop";
import {
  claimRegistrationKey,
  findRegistrationIdByKey,
  linkOrder,
  redisConfigured,
  redisPaymentStore,
  saveRegistration,
  type RegistrationRecord,
} from "./store";
import type { CheckoutOrder, VerifiedRegistration } from "./types";

export class PaymentsUnavailableError extends Error {
  constructor(message = "Online payments are not enabled yet.") {
    super(message);
    this.name = "PaymentsUnavailableError";
  }
}

/** The same person (email + phone) already has a PAID registration. Never charge twice. */
export class AlreadyRegisteredError extends Error {
  constructor() {
    super("This email / phone number is already registered.");
    this.name = "AlreadyRegisteredError";
  }
}

export function paymentConfig() {
  return {
    enabled: process.env.PAYMENTS_ENABLED === "true",
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  };
}

export function paymentsEnabled(): boolean {
  const c = paymentConfig();
  // Redis is required to record registrations/payments; without it, refuse cleanly instead of failing mid-checkout.
  return c.enabled && Boolean(c.keyId && c.keySecret) && redisConfigured();
}

// ---- Razorpay REST API (server only, Basic auth with key_id:key_secret) ----------------------

async function razorpayApi<T>(path: string, init?: { method: "POST"; body: unknown }): Promise<T> {
  const { keyId, keySecret } = paymentConfig();
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      ...(init ? { "Content-Type": "application/json" } : {}),
    },
    body: init ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Razorpay ${path} responded ${res.status}`);
  return (await res.json()) as T;
}

export type RazorpayPayment = { id: string; order_id: string; amount: number; currency: string; status: string };

export function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  return razorpayApi<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`);
}

// ---- Checkout --------------------------------------------------------------------------------

export type CheckoutContext = { eventSourceUrl?: string; fbp?: string; fbc?: string };

/** Stable per-person key so double-clicks, reloads and retries never create a second registration. */
export function registrationKey(details: RegistrationDetails): string {
  return createHash("sha256").update(`${details.email.trim().toLowerCase()}|${details.phone}`).digest("hex");
}

export async function createCheckoutOrder(
  details: RegistrationDetails,
  attribution: Attribution,
  ctx: CheckoutContext = {},
): Promise<CheckoutOrder> {
  if (!paymentsEnabled()) throw new PaymentsUnavailableError();
  const { keyId } = paymentConfig();

  const key = registrationKey(details);
  const candidateId = randomUUID();
  const owned = await claimRegistrationKey(key, candidateId);
  const registrationId = owned ? candidateId : ((await findRegistrationIdByKey(key)) ?? candidateId);

  let existing: RegistrationRecord | null = null;
  if (!owned) {
    existing = await redisPaymentStore.getRegistration(registrationId);
    if (existing?.status === "PAID") throw new AlreadyRegisteredError();
  }

  // Newest details win (e.g. a corrected name). Status/amount/ids are never overwritten here.
  await saveRegistration({
    registrationId,
    ...(existing ? {} : { status: "PENDING" as const, amountPaise: workshop.pricePaise, currency: workshop.currency }),
    ...(existing ? {} : { purchaseEventId: randomUUID(), createdAt: new Date().toISOString() }),
    name: details.name,
    email: details.email,
    phone: details.phone,
    eventSourceUrl: ctx.eventSourceUrl,
    fbp: ctx.fbp,
    fbc: ctx.fbc,
    attribution: JSON.stringify(attribution),
  });

  // Retry of an unpaid registration: reuse its order (Razorpay lets a customer retry on the same order).
  let orderId = existing?.orderId;
  if (!orderId) {
    const order = await razorpayApi<{ id: string }>("/orders", {
      method: "POST",
      body: {
        amount: workshop.pricePaise,
        currency: workshop.currency,
        receipt: registrationId, // lets the webhook find the registration even without the order link
        notes: { registration_id: registrationId, ...utmNotes(attribution) },
      },
    });
    orderId = order.id;
    await linkOrder(orderId, registrationId);
  }

  return {
    provider: "razorpay",
    keyId,
    orderId,
    registrationId,
    amountPaise: workshop.pricePaise,
    currency: workshop.currency,
    name: workshop.name,
    description: `${workshop.format} · ${workshop.day} ${workshop.time}`,
    prefill: { name: details.name, email: details.email, contact: details.phone },
  };
}

function utmNotes(a: Attribution): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
    if (a[k]) out[k] = a[k]!.slice(0, 200);
  }
  return out;
}

// ---- Access to the confirmation page ---------------------------------------------------------
// The registration id is an unguessable UUID, and on top of that the page needs a cookie that the
// server only sets after it has verified the payment in this browser. A copied URL alone shows nothing.

export const ACCESS_COOKIE = "htnb_reg";
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function accessSig(registrationId: string): string {
  return createHmac("sha256", paymentConfig().keySecret).update(`access|${registrationId}`).digest("hex");
}

export function createAccessToken(registrationId: string): string {
  return `${registrationId}.${accessSig(registrationId)}`;
}

export function accessTokenMatches(registrationId: string, token: string | undefined): boolean {
  if (!token || !paymentConfig().keySecret) return false;
  const expected = Buffer.from(createAccessToken(registrationId));
  const got = Buffer.from(token);
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export type RegistrationView =
  | { state: "paid"; registration: VerifiedRegistration }
  | { state: "pending" } // known to this browser but not confirmed yet (webhook may still be on its way)
  | { state: "none" };

/** What the success page may show. Reveals nothing unless the cookie proves this browser paid. */
export async function getRegistrationView(
  registrationId: string | undefined,
  accessToken: string | undefined,
): Promise<RegistrationView> {
  if (!registrationId || !accessTokenMatches(registrationId, accessToken)) return { state: "none" };
  const reg = await redisPaymentStore.getRegistration(registrationId);
  if (!reg) return { state: "none" };
  if (reg.status !== "PAID" || !reg.orderId || !reg.paymentId) return { state: "pending" };
  return {
    state: "paid",
    registration: {
      registrationId,
      orderId: reg.orderId,
      paymentId: reg.paymentId,
      amountPaise: reg.amountPaise,
      currency: reg.currency,
      purchaseEventId: reg.purchaseEventId ?? registrationId,
      verifiedAt: reg.paidAt ?? "",
      name: reg.name ?? "",
    },
  };
}

/** Official workshop WhatsApp group. Server-only so it is revealed only after verified payment. */
const DEFAULT_GROUP_URL = "https://chat.whatsapp.com/FWfN896gvHV3jMTm3uplal?s=cl&p=a&iam=2";

export function whatsappGroupUrl(): string | null {
  const url = (process.env.WHATSAPP_GROUP_URL?.trim() || DEFAULT_GROUP_URL).trim();
  return /^https:\/\//.test(url) ? url : null;
}
