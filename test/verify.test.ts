import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { parseVerifyInput, verifyCheckoutPayment, type VerifyDeps } from "../lib/payment/verify.ts";
import type { MarkResult, PaymentStore, RegistrationRecord } from "../lib/payment/store.ts";

const SECRET = "key_secret";
const sign = (orderId: string, paymentId: string) => createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");

function setup(over: Partial<RegistrationRecord> = {}, payment = { order_id: "order_1", amount: 900, currency: "INR", status: "captured" }) {
  const reg: RegistrationRecord = { registrationId: "reg_1", status: "PENDING", orderId: "order_1", amountPaise: 900, currency: "INR", ...over };
  let paidNow = 0;
  const store = {
    async getRegistration() { return reg; },
    async markPaid(_id: string, paymentId: string): Promise<MarkResult> {
      if (reg.status === "PAID") return "already_paid";
      reg.status = "PAID"; reg.paymentId = paymentId; return "paid_now";
    },
  } as unknown as PaymentStore;
  const deps: VerifyDeps = {
    store,
    verifySignature: ({ orderId, paymentId, signature }) => sign(orderId, paymentId) === signature,
    fetchPayment: async () => payment,
    onPaidNow: async () => { paidNow++; },
  };
  return { reg, deps, paidCount: () => paidNow };
}
const input = (over: Record<string, string> = {}) => ({
  registrationId: "reg_1", razorpay_order_id: "order_1", razorpay_payment_id: "pay_1", razorpay_signature: sign("order_1", "pay_1"), ...over,
});

test("valid signature + matching captured payment -> PAID, Purchase fired once even if verified twice", async () => {
  const { reg, deps, paidCount } = setup();
  assert.equal((await verifyCheckoutPayment(input(), deps)).status, "paid");
  assert.equal((await verifyCheckoutPayment(input(), deps)).status, "paid"); // double callback / webhook already won
  assert.equal(reg.status, "PAID");
  assert.equal(paidCount(), 1);
});

test("forged signature is rejected and nothing is marked paid", async () => {
  const { reg, deps } = setup();
  const r = await verifyCheckoutPayment(input({ razorpay_signature: "a".repeat(64) }), deps);
  assert.equal(r.status, "invalid");
  assert.equal(reg.status, "PENDING");
});

test("order id that is not the registration's own order is rejected", async () => {
  const { reg, deps } = setup();
  const r = await verifyCheckoutPayment(input({ razorpay_order_id: "order_other", razorpay_signature: sign("order_other", "pay_1") }), deps);
  assert.equal(r.status, "invalid");
  assert.equal(reg.status, "PENDING");
});

test("Razorpay says amount/order differs -> invalid; not captured -> pending; failed -> invalid", async () => {
  assert.equal((await verifyCheckoutPayment(input(), setup({}, { order_id: "order_1", amount: 100, currency: "INR", status: "captured" }).deps)).status, "invalid");
  assert.equal((await verifyCheckoutPayment(input(), setup({}, { order_id: "order_2", amount: 900, currency: "INR", status: "captured" }).deps)).status, "invalid");
  const auth = setup({}, { order_id: "order_1", amount: 900, currency: "INR", status: "authorized" });
  assert.equal((await verifyCheckoutPayment(input(), auth.deps)).status, "pending");
  assert.equal(auth.reg.status, "PENDING");
  assert.equal((await verifyCheckoutPayment(input(), setup({}, { order_id: "order_1", amount: 900, currency: "INR", status: "failed" }).deps)).status, "invalid");
});

test("malformed input is rejected before touching anything", () => {
  assert.equal(parseVerifyInput(null), null);
  assert.equal(parseVerifyInput({ ...input(), razorpay_signature: "short" }), null);
  assert.equal(parseVerifyInput({ ...input(), registrationId: "../etc" }), null);
  assert.ok(parseVerifyInput(input()));
});
