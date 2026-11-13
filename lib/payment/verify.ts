// Server-side verification of the Razorpay Checkout success callback – SERVER ONLY.
// The browser's "success" is only a claim. A registration becomes PAID only if ALL of these hold:
//   1. the registration exists and the order id is the one WE created for it,
//   2. HMAC_SHA256(order_id|payment_id, key_secret) matches razorpay_signature,
//   3. Razorpay's own API says the payment belongs to that order, has our amount/currency and is captured.
// The final PENDING/FAILED -> PAID flip is the same atomic store.markPaid() the webhook uses,
// so verify + webhook racing each other still produce exactly one paid transition.
import type { PaymentStore } from "./store";

export type VerifyInput = {
  registrationId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

export type VerifyResult =
  | { status: "paid"; registrationId: string }
  | { status: "pending" } // payment exists but is not captured (yet); the webhook completes it later
  | { status: "invalid" } // bad input, bad signature, wrong order/amount – never marked paid
  | { status: "not_found" };

export type VerifyDeps = {
  store: PaymentStore;
  verifySignature: (p: { orderId: string; paymentId: string; signature: string }) => boolean;
  fetchPayment: (paymentId: string) => Promise<{ order_id: string; amount: number; currency: string; status: string }>;
  /** Called once, only on the single PENDING -> PAID transition (e.g. server-side Purchase event). */
  onPaidNow?: (registrationId: string) => Promise<void>;
  now?: () => Date;
};

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const SIG = /^[a-f0-9]{64}$/i;

export function parseVerifyInput(body: unknown): VerifyInput | null {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
  if (
    typeof registrationId === "string" && ID.test(registrationId) &&
    typeof razorpay_order_id === "string" && ID.test(razorpay_order_id) &&
    typeof razorpay_payment_id === "string" && ID.test(razorpay_payment_id) &&
    typeof razorpay_signature === "string" && SIG.test(razorpay_signature)
  ) {
    return { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature };
  }
  return null;
}

export async function verifyCheckoutPayment(input: VerifyInput, deps: VerifyDeps): Promise<VerifyResult> {
  const reg = await deps.store.getRegistration(input.registrationId);
  if (!reg) return { status: "not_found" };
  if (!reg.orderId || reg.orderId !== input.razorpay_order_id) return { status: "invalid" };

  const signatureOk = deps.verifySignature({
    orderId: input.razorpay_order_id,
    paymentId: input.razorpay_payment_id,
    signature: input.razorpay_signature,
  });
  if (!signatureOk) return { status: "invalid" };

  const payment = await deps.fetchPayment(input.razorpay_payment_id); // throws on network error -> caller retries
  if (payment.order_id !== reg.orderId || payment.amount !== reg.amountPaise || payment.currency !== reg.currency) {
    return { status: "invalid" };
  }
  if (payment.status === "failed") return { status: "invalid" };
  if (payment.status !== "captured") return { status: "pending" };

  const r = await deps.store.markPaid(reg.registrationId, input.razorpay_payment_id, (deps.now?.() ?? new Date()).toISOString());
  if (r === "missing") return { status: "not_found" };
  if (r === "paid_now") await deps.onPaidNow?.(reg.registrationId).catch(() => {});
  return { status: "paid", registrationId: reg.registrationId };
}
