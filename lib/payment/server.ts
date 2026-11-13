// Payment service – SERVER ONLY. Never import this file from a client component.
//
// No database: Razorpay is the system of record.
//   1. createCheckoutOrder(): creates a Razorpay order for the workshop price (taken from lib/workshop.ts, never from
//      the browser) and stores the customer's name / email / phone / UTM as order notes, so they show up in the
//      Razorpay dashboard next to the payment. One person (email+phone) maps to one order via a deterministic
//      `receipt`, so retries reuse the same unpaid order and an already-paid person can't pay twice.
//   2. The browser pays in the Razorpay popup -> POST /api/payments/verify (signature + Razorpay API check).
//   3. Razorpay -> POST /api/razorpay/webhook confirms captures/failures independently of the browser.
//   4. /payment/success renders only with a signed cookie from step 2 AND a live "captured" check with Razorpay.
import { createHash } from "node:crypto";
import type { RegistrationDetails } from "@/lib/registration";
import type { Attribution } from "@/lib/tracking/attribution";
import { workshop } from "@/lib/workshop";
import { createAccessToken as signAccess, readAccessToken } from "./access";
import { createOrder, fetchOrder, fetchPayment, listOrdersByReceipt, orderNotes, paymentConfig, updateOrderNotes } from "./razorpay";
import { checkPayment, PRODUCT } from "./verify";
import { purchaseEventId } from "./purchase";
import type { CheckoutOrder, VerifiedRegistration } from "./types";

export { paymentConfig, fetchOrder, fetchPayment };

export class PaymentsUnavailableError extends Error {
  constructor(message = "Online payments are not enabled yet.") {
    super(message);
    this.name = "PaymentsUnavailableError";
  }
}

/** The same person (email + phone) has already paid. Never charge twice. */
export class AlreadyRegisteredError extends Error {
  constructor() {
    super("This email / phone number is already registered.");
    this.name = "AlreadyRegisteredError";
  }
}

export function paymentsEnabled(): boolean {
  const c = paymentConfig();
  return c.enabled && Boolean(c.keyId && c.keySecret);
}

export const EXPECTED = { amountPaise: workshop.pricePaise, currency: workshop.currency } as const;

// ---- Checkout --------------------------------------------------------------------------------

export type CheckoutContext = { eventSourceUrl?: string; fbp?: string; fbc?: string };

/** Deterministic per-person order key (Razorpay receipts are limited to 40 characters). */
export function receiptFor(details: RegistrationDetails): string {
  return createHash("sha256").update(`${details.email.trim().toLowerCase()}|${details.phone}`).digest("hex").slice(0, 40);
}

export async function createCheckoutOrder(
  details: RegistrationDetails,
  attribution: Attribution,
  ctx: CheckoutContext = {},
): Promise<CheckoutOrder> {
  if (!paymentsEnabled()) throw new PaymentsUnavailableError();
  const { keyId } = paymentConfig();

  const receipt = receiptFor(details);
  const notes = buildNotes(details, attribution, ctx);

  const existing = (await listOrdersByReceipt(receipt)).filter((o) => orderNotes(o).product === PRODUCT);
  if (existing.some((o) => o.status === "paid")) throw new AlreadyRegisteredError();

  // Reuse an unpaid order for the same person (retry / reload / double click); otherwise create one.
  let orderId = existing.find((o) => o.amount === EXPECTED.amountPaise && o.currency === EXPECTED.currency)?.id;
  if (orderId) {
    await updateOrderNotes(orderId, notes).catch(() => {}); // keep the newest details; not critical
  } else {
    orderId = (await createOrder({ amount: EXPECTED.amountPaise, currency: EXPECTED.currency, receipt, notes })).id;
  }

  return {
    provider: "razorpay",
    keyId,
    orderId,
    amountPaise: EXPECTED.amountPaise,
    currency: EXPECTED.currency,
    name: workshop.name,
    description: `${workshop.format} · ${workshop.day} ${workshop.time}`,
    prefill: { name: details.name, email: details.email, contact: details.phone },
  };
}

/** Razorpay notes: max 15 keys, values up to 256 chars. This is the customer record shown in the dashboard. */
function buildNotes(details: RegistrationDetails, a: Attribution, ctx: CheckoutContext): Record<string, string> {
  const notes: Record<string, string> = {
    product: PRODUCT,
    name: details.name.slice(0, 100),
    email: details.email.slice(0, 120),
    phone: details.phone,
  };
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
    if (a[k]) notes[k] = a[k]!.slice(0, 200);
  }
  if (ctx.fbp) notes.fbp = ctx.fbp.slice(0, 100);
  if (ctx.fbc) notes.fbc = ctx.fbc.slice(0, 200);
  if (ctx.eventSourceUrl) notes.source_url = ctx.eventSourceUrl.slice(0, 250);
  return notes;
}

// ---- Access to the confirmation page ---------------------------------------------------------

export const ACCESS_COOKIE = "htnb_reg";
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export const createAccessToken = (c: { orderId: string; paymentId: string; name: string }) =>
  signAccess(c, paymentConfig().keySecret);

export type RegistrationView =
  | { state: "paid"; registration: VerifiedRegistration }
  | { state: "pending" } // signed in this browser, but Razorpay hasn't captured the payment yet
  | { state: "none" };

/** What the success page may show. Needs the signed cookie AND a live confirmation from Razorpay. */
export async function getRegistrationView(orderId: string | undefined, token: string | undefined): Promise<RegistrationView> {
  const claims = readAccessToken(token, paymentConfig().keySecret);
  if (!claims || !orderId || claims.o !== orderId) return { state: "none" };
  try {
    const r = await checkPayment(claims.o, claims.p, { expected: EXPECTED, fetchPayment, fetchOrder: loadOrder });
    if (r.status === "invalid") return { state: "none" };
    if (r.status === "pending") return { state: "pending" };
    return {
      state: "paid",
      registration: {
        orderId: r.orderId,
        paymentId: r.paymentId,
        amountPaise: EXPECTED.amountPaise,
        currency: EXPECTED.currency,
        purchaseEventId: purchaseEventId(r.paymentId),
        name: claims.n || r.name,
      },
    };
  } catch {
    return { state: "pending" }; // Razorpay unreachable: don't show an error, the page retries automatically
  }
}

export async function loadOrder(id: string) {
  const o = await fetchOrder(id);
  return { amount: o.amount, currency: o.currency, notes: orderNotes(o) };
}

/** Official workshop WhatsApp group. Server-only so it is revealed only after verified payment. */
const DEFAULT_GROUP_URL = "https://chat.whatsapp.com/FWfN896gvHV3jMTm3uplal?s=cl&p=a&iam=2";

export function whatsappGroupUrl(): string | null {
  const url = (process.env.WHATSAPP_GROUP_URL?.trim() || DEFAULT_GROUP_URL).trim();
  return /^https:\/\//.test(url) ? url : null;
}
