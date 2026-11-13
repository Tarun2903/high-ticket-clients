// Payment service – SERVER ONLY. Never import this file from a client component.
//
// PHASE 1 (current): payments are disabled. createCheckoutOrder() always throws
// PaymentsUnavailableError, so no order is created and no money can be collected.
//
// PHASE 2 (Razorpay) – implementation plan:
//   1. createCheckoutOrder():
//        - insert a registration row { status: "pending_payment", details, attribution }
//        - POST https://api.razorpay.com/v1/orders  (Basic auth key_id:key_secret)
//          body { amount: workshop.pricePaise, currency: workshop.currency,
//                 receipt: registrationId, notes: { ...attribution } }
//        - save order.id on the registration, return CheckoutOrder
//   2. /api/payments/verify: verifyPaymentSignature() with RAZORPAY_KEY_SECRET,
//        check the order belongs to the registration, mark it "paid" (idempotent),
//        send CAPI Purchase (event_id = purchaseEventId), return the success URL.
//   3. /api/payments/webhook: verifyWebhookSignature(), handle payment.captured /
//        order.paid as a backup for users who close the tab before the handler runs.
//   4. getVerifiedRegistration(): read the registration; return it only if status === "paid".

import type { RegistrationDetails } from "@/lib/registration";
import type { Attribution } from "@/lib/tracking/attribution";
import type { CheckoutOrder, VerifiedRegistration } from "./types";

export class PaymentsUnavailableError extends Error {
  constructor(message = "Online payments are not enabled yet.") {
    super(message);
    this.name = "PaymentsUnavailableError";
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
  return c.enabled && Boolean(c.keyId && c.keySecret);
}

export async function createCheckoutOrder(
  _details: RegistrationDetails,
  _attribution: Attribution,
): Promise<CheckoutOrder> {
  if (!paymentsEnabled()) throw new PaymentsUnavailableError();
  // PHASE 2: implement step 1 above. Until then, refuse even if env vars are set.
  throw new PaymentsUnavailableError("Razorpay order creation is not implemented yet (Phase 2).");
}

/** Returns the registration ONLY if its payment has been verified server-side. */
export async function getVerifiedRegistration(registrationId: string | undefined): Promise<VerifiedRegistration | null> {
  if (!registrationId) return null;
  // PHASE 2: look up the registration in the database and return it when status === "paid".
  return null;
}

/** Official workshop WhatsApp group. Server-only so it is revealed only after verified payment. */
export function whatsappGroupUrl(): string | null {
  const url = process.env.WHATSAPP_GROUP_URL?.trim();
  return url && /^https:\/\//.test(url) ? url : null;
}
