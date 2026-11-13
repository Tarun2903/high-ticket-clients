// Razorpay webhook payload parsing – pure. The HTTP layer verifies X-Razorpay-Signature first.
// There is no database to update: Razorpay already records every order and payment. The webhook's job is
// (a) an authenticated, logged confirmation, and (b) firing the server-side Purchase event once a real,
// captured payment for this workshop is confirmed, even if the customer closed the tab.

export type WebhookEvent = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        currency?: string;
        status?: string;
        email?: string;
        contact?: string;
        error_code?: string;
      };
    };
    order?: { entity?: { id?: string; amount?: number; amount_paid?: number; currency?: string; status?: string } };
  };
};

export type ParsedWebhook =
  | { kind: "paid"; orderId: string; paymentId: string; amount: number; currency: string; email?: string; contact?: string }
  | { kind: "failed"; orderId?: string; paymentId?: string; reason: string }
  | { kind: "ignored"; event: string };

export function parseWebhook(evt: WebhookEvent): ParsedWebhook {
  const event = evt.event ?? "";
  const pay = evt.payload?.payment?.entity;
  const order = evt.payload?.order?.entity;

  if (event === "payment.failed") {
    return { kind: "failed", orderId: pay?.order_id, paymentId: pay?.id, reason: pay?.error_code ?? "payment failed" };
  }
  if (event === "payment.captured" || event === "order.paid") {
    const orderId = pay?.order_id ?? order?.id;
    const captured = pay?.status === "captured" && (event === "payment.captured" || order?.status === "paid");
    if (!orderId || !pay?.id || !captured || typeof pay.amount !== "number" || !pay.currency) {
      return { kind: "ignored", event };
    }
    return { kind: "paid", orderId, paymentId: pay.id, amount: pay.amount, currency: pay.currency, email: pay.email, contact: pay.contact };
  }
  return { kind: "ignored", event };
}
