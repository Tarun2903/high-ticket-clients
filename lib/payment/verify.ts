// Server-side verification of the Razorpay Checkout success callback – SERVER ONLY, dependencies injected.
// The browser's "success" is only a claim. It is accepted only if ALL of these hold:
//   1. HMAC_SHA256(order_id|payment_id, key_secret) equals razorpay_signature,
//   2. Razorpay's own API says that payment belongs to that order, in OUR amount and currency,
//   3. the order is one WE created for this workshop (order note product = "htnb-workshop"),
//   4. the payment status is "captured".
// There is no database: Razorpay is the record, so asking Razorpay is the verification.

export const PRODUCT = "htnb-workshop";

export type VerifyInput = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

export type VerifyResult =
  | { status: "paid"; orderId: string; paymentId: string; name: string }
  | { status: "pending"; orderId: string; paymentId: string; name: string } // exists but not captured (yet)
  | { status: "invalid" };

export type VerifyDeps = {
  expected: { amountPaise: number; currency: string };
  verifySignature: (p: { orderId: string; paymentId: string; signature: string }) => boolean;
  fetchPayment: (id: string) => Promise<{ order_id: string; amount: number; currency: string; status: string }>;
  fetchOrder: (id: string) => Promise<{ amount: number; currency: string; notes: Record<string, string> }>;
};

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const SIG = /^[a-f0-9]{64}$/i;

export function parseVerifyInput(body: unknown): VerifyInput | null {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = b;
  if (
    typeof razorpay_order_id === "string" && ID.test(razorpay_order_id) &&
    typeof razorpay_payment_id === "string" && ID.test(razorpay_payment_id) &&
    typeof razorpay_signature === "string" && SIG.test(razorpay_signature)
  ) {
    return { razorpay_order_id, razorpay_payment_id, razorpay_signature };
  }
  return null;
}

/** Confirms that (orderId, paymentId) is a genuine payment for this workshop. Throws only on network errors. */
export async function checkPayment(
  orderId: string,
  paymentId: string,
  deps: Pick<VerifyDeps, "expected" | "fetchPayment" | "fetchOrder">,
): Promise<VerifyResult> {
  const [payment, order] = await Promise.all([deps.fetchPayment(paymentId), deps.fetchOrder(orderId)]);
  const { amountPaise, currency } = deps.expected;
  if (payment.order_id !== orderId) return { status: "invalid" };
  if (payment.amount !== amountPaise || payment.currency !== currency) return { status: "invalid" };
  if (order.amount !== amountPaise || order.currency !== currency || order.notes.product !== PRODUCT) {
    return { status: "invalid" };
  }
  if (payment.status === "failed") return { status: "invalid" };
  const name = order.notes.name ?? "";
  if (payment.status !== "captured") return { status: "pending", orderId, paymentId, name };
  return { status: "paid", orderId, paymentId, name };
}

export async function verifyCheckoutPayment(input: VerifyInput, deps: VerifyDeps): Promise<VerifyResult> {
  const signatureOk = deps.verifySignature({
    orderId: input.razorpay_order_id,
    paymentId: input.razorpay_payment_id,
    signature: input.razorpay_signature,
  });
  if (!signatureOk) return { status: "invalid" };
  return checkPayment(input.razorpay_order_id, input.razorpay_payment_id, deps);
}
