// Razorpay signature checks (server only). Pure functions, ready for Phase 2.
// Docs: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/build-integration/#verify-payment-signature
import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualHex(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Checkout success handler: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(
  params: { orderId: string; paymentId: string; signature: string },
  keySecret: string,
): boolean {
  if (!params.orderId || !params.paymentId || !params.signature || !keySecret) return false;
  const expected = createHmac("sha256", keySecret).update(`${params.orderId}|${params.paymentId}`).digest("hex");
  return safeEqualHex(expected, params.signature);
}

/** Webhooks: X-Razorpay-Signature = HMAC_SHA256(raw request body, webhook_secret). */
export function verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
  if (!rawBody || !signature || !webhookSecret) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
