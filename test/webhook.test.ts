import test from "node:test";
import assert from "node:assert/strict";
import { handleRazorpayEvent, type RazorpayEvent } from "../lib/payment/webhook.ts";
import type { MarkResult, PaymentStore, RegistrationRecord } from "../lib/payment/store.ts";

function memoryStore(regs: RegistrationRecord[]): PaymentStore & { regs: Map<string, RegistrationRecord> } {
  const map = new Map(regs.map((r) => [r.registrationId, { ...r }]));
  const orders = new Map(regs.filter((r) => r.orderId).map((r) => [r.orderId!, r.registrationId]));
  return {
    regs: map,
    async getRegistration(id) { return map.get(id) ?? null; },
    async findRegistrationIdByOrder(o) { return orders.get(o) ?? null; },
    async markPaid(id, paymentId, at): Promise<MarkResult> {
      const r = map.get(id); if (!r) return "missing"; if (r.status === "PAID") return "already_paid";
      Object.assign(r, { status: "PAID", paymentId, paidAt: at }); return "paid_now";
    },
    async markFailed(id, reason): Promise<MarkResult> {
      const r = map.get(id); if (!r) return "missing"; if (r.status === "PAID") return "already_paid";
      Object.assign(r, { status: "FAILED", failureReason: reason }); return "failed";
    },
    async claimEvent() { return "claimed"; }, async completeEvent() {}, async releaseEvent() {},
  };
}

const reg = (): RegistrationRecord => ({ registrationId: "reg_1", status: "PENDING", orderId: "order_1", amountPaise: 900, currency: "INR" });
const captured = (over: Record<string, unknown> = {}): RazorpayEvent => ({
  event: "payment.captured",
  payload: { payment: { entity: { id: "pay_1", order_id: "order_1", amount: 900, currency: "INR", status: "captured", ...over } } },
});

test("payment.captured marks paid once; replay is idempotent", async () => {
  const s = memoryStore([reg()]);
  assert.equal((await handleRazorpayEvent(captured(), s)).outcome, "paid");
  assert.equal((await handleRazorpayEvent(captured(), s)).outcome, "already_paid");
  assert.equal(s.regs.get("reg_1")!.status, "PAID");
});

test("order.paid also marks paid (and finds the registration by receipt if order is not linked)", async () => {
  const s = memoryStore([{ ...reg(), orderId: undefined }]);
  const evt: RazorpayEvent = {
    event: "order.paid",
    payload: {
      order: { entity: { id: "order_9", amount_paid: 900, currency: "INR", status: "paid", receipt: "reg_1" } },
      payment: { entity: { id: "pay_9", order_id: "order_9", amount: 900, currency: "INR", status: "captured" } },
    },
  };
  assert.equal((await handleRazorpayEvent(evt, s)).outcome, "paid");
});

test("wrong amount, wrong currency or non-captured status never marks paid", async () => {
  for (const over of [{ amount: 100 }, { currency: "USD" }, { status: "authorized" }]) {
    const s = memoryStore([reg()]);
    const out = (await handleRazorpayEvent(captured(over), s)).outcome;
    assert.notEqual(out, "paid");
    assert.equal(s.regs.get("reg_1")!.status, "PENDING");
  }
});

test("payment.failed records failure but never downgrades a paid registration", async () => {
  const s = memoryStore([reg()]);
  const failed: RazorpayEvent = { event: "payment.failed", payload: { payment: { entity: { id: "pay_f", order_id: "order_1", error_code: "BAD_REQUEST_ERROR" } } } };
  assert.equal((await handleRazorpayEvent(failed, s)).outcome, "failed_recorded");
  assert.equal((await handleRazorpayEvent(captured(), s)).outcome, "paid"); // retry after failure succeeds
  assert.equal((await handleRazorpayEvent(failed, s)).outcome, "already_paid");
  assert.equal(s.regs.get("reg_1")!.status, "PAID");
});

test("unknown orders and unhandled events change nothing", async () => {
  const s = memoryStore([reg()]);
  assert.equal((await handleRazorpayEvent(captured({ order_id: "order_x" }), s)).outcome, "unknown_order");
  assert.equal((await handleRazorpayEvent({ event: "refund.created" }, s)).outcome, "ignored_event");
  assert.equal(s.regs.get("reg_1")!.status, "PENDING");
});
