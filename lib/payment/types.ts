// Contracts between the UI, the API routes and the payment provider.
// Shaped for Razorpay Standard Checkout so Phase 2 only fills in the implementations.

import type { RegistrationDetails } from "@/lib/registration";
import type { Attribution } from "@/lib/tracking/attribution";

/** Body the browser sends to POST /api/checkout. Amount is never sent by the client. */
export type CheckoutRequest = {
  details: RegistrationDetails;
  attribution: Attribution;
  eventSourceUrl: string;
};

/** What Razorpay Checkout needs to open. key_id is public by design; the secret never leaves the server. */
export type CheckoutOrder = {
  provider: "razorpay";
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
};

export type CheckoutResponse =
  | { status: "ready"; order: CheckoutOrder }
  | { status: "unavailable"; message: string }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "error"; message: string };

/** Fields Razorpay Checkout returns to its success handler; sent to POST /api/payments/verify. */
export type PaymentVerificationRequest = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/** A payment that Razorpay itself confirmed as captured, for our order and amount. */
export type VerifiedRegistration = {
  orderId: string;
  paymentId: string;
  amountPaise: number;
  currency: string;
  /** event_id used for the server CAPI Purchase event; reused by the browser Pixel for dedup. */
  purchaseEventId: string;
  name: string;
};
