// Razorpay webhook event handling – SERVER ONLY. Pure logic over an injected PaymentStore so it is testable.
//
// Trust model: the HTTP layer has already verified X-Razorpay-Signature over the raw body, so the payload
// really comes from Razorpay. On top of that, a registration is only marked paid when
//   - Razorpay reports the money as captured/paid (payment.status === "captured" / order.status === "paid"),
//   - the order maps to a registration we created ourselves (we never create registrations here),
//   - amount and currency equal what we stored when the order was created.
import type { PaymentStore, RegistrationRecord } from "./store";

export type HandleOutcome =
  | "paid"
  | "already_paid"
  | "failed_recorded"
  | "ignored_event"
  | "ignored_not_captured"
  | "unknown_order"
  | "amount_mismatch"
  | "order_mismatch";

type PaymentEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error_code?: string;
  error_description?: string;
};
type OrderEntity = {
  id?: string;
  amount?: number;
  amount_paid?: number;
  currency?: string;
  status?: string;
  receipt?: string;
};
export type RazorpayEvent = {
  event?: string;
  payload?: { payment?: { entity?: PaymentEntity }; order?: { entity?: OrderEntity } };
};

export type HandleResult = { outcome: HandleOutcome; registrationId?: string; orderId?: string };

export const HANDLED_EVENTS = ["payment.captured", "payment.failed", "order.paid"] as const;

export async function handleRazorpayEvent(
  evt: RazorpayEvent,
  store: PaymentStore,
  now: () => Date = () => new Date(),
): Promise<HandleResult> {
  const name = evt.event;
  if (name !== "payment.captured" && name !== "payment.failed" && name !== "order.paid") {
    return { outcome: "ignored_event" };
  }

  const payment = evt.payload?.payment?.entity;
  const order = evt.payload?.order?.entity;
  const orderId = str(payment?.order_id) ?? str(order?.id);
  if (!orderId) return { outcome: "unknown_order" };

  const reg = await locate(store, orderId, str(order?.receipt));
  if (!reg) return { outcome: "unknown_order", orderId };
  const base = { registrationId: reg.registrationId, orderId };

  // A registration is bound to exactly one Razorpay order once linked.
  if (reg.orderId && reg.orderId !== orderId) return { outcome: "order_mismatch", ...base };

  if (name === "payment.failed") {
    const reason = [payment?.error_code, payment?.error_description].filter(Boolean).join(": ") || "payment failed";
    const r = await store.markFailed(reg.registrationId, reason);
    return { outcome: r === "already_paid" ? "already_paid" : "failed_recorded", ...base };
  }

  // payment.captured / order.paid -> candidate for "paid". Verify before trusting.
  const paymentId = str(payment?.id);
  if (!paymentId) return { outcome: "ignored_not_captured", ...base };

  const captured =
    name === "payment.captured"
      ? payment?.status === "captured"
      : order?.status === "paid" && payment?.status === "captured";
  if (!captured) return { outcome: "ignored_not_captured", ...base };

  const amount = name === "order.paid" ? order?.amount_paid : payment?.amount;
  const currency = payment?.currency ?? order?.currency;
  if (amount !== reg.amountPaise || currency !== reg.currency) return { outcome: "amount_mismatch", ...base };

  const r = await store.markPaid(reg.registrationId, paymentId, now().toISOString());
  if (r === "paid_now") return { outcome: "paid", ...base };
  if (r === "already_paid") return { outcome: "already_paid", ...base };
  return { outcome: "unknown_order", ...base };
}

async function locate(store: PaymentStore, orderId: string, receipt?: string): Promise<RegistrationRecord | null> {
  const id = (await store.findRegistrationIdByOrder(orderId)) ?? receipt;
  return id ? store.getRegistration(id) : null;
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
