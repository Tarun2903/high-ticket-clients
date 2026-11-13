import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { checkPayment, parseVerifyInput, verifyCheckoutPayment, PRODUCT, type VerifyDeps } from "../lib/payment/verify.ts";
import { createAccessToken, readAccessToken } from "../lib/payment/access.ts";
import { parseWebhook } from "../lib/payment/webhook.ts";

const SECRET = "key_secret";
const sign = (o: string, p: string) => createHmac("sha256", SECRET).update(`${o}|${p}`).digest("hex");

type Pay = { order_id: string; amount: number; currency: string; status: string };
type Ord = { amount: number; currency: string; notes: Record<string, string> };

function deps(pay: Partial<Pay> = {}, ord: Partial<Ord> = {}): VerifyDeps {
  return {
    expected: { amountPaise: 900, currency: "INR" },
    verifySignature: ({ orderId, paymentId, signature }) => sign(orderId, paymentId) === signature,
    fetchPayment: async () => ({ order_id: "order_1", amount: 900, currency: "INR", status: "captured", ...pay }),
    fetchOrder: async () => ({ amount: 900, currency: "INR", notes: { product: PRODUCT, name: "Asha Rao" }, ...ord }),
  };
}
const input = (over: Record<string, string> = {}) => ({
  razorpay_order_id: "order_1",
  razorpay_payment_id: "pay_1",
  razorpay_signature: sign("order_1", "pay_1"),
  ...over,
});

test("valid signature + captured payment for our order/amount -> paid, with the customer's name", async () => {
  const r = await verifyCheckoutPayment(input(), deps());
  assert.deepEqual(r, { status: "paid", orderId: "order_1", paymentId: "pay_1", name: "Asha Rao" });
});

test("forged signature is rejected", async () => {
  assert.equal((await verifyCheckoutPayment(input({ razorpay_signature: "a".repeat(64) }), deps())).status, "invalid");
});

test("wrong amount, currency, order or product is never accepted", async () => {
  for (const [pay, ord] of [
    [{ amount: 100 }, {}],
    [{ currency: "USD" }, {}],
    [{ order_id: "order_other" }, {}],
    [{}, { amount: 100 }],
    [{}, { notes: { product: "some-other-product" } }],
    [{}, { notes: {} }],
  ] as [Partial<Pay>, Partial<Ord>][]) {
    assert.equal((await verifyCheckoutPayment(input(), deps(pay, ord))).status, "invalid");
  }
});

test("authorized-but-not-captured is pending; failed is invalid", async () => {
  assert.equal((await verifyCheckoutPayment(input(), deps({ status: "authorized" }))).status, "pending");
  assert.equal((await verifyCheckoutPayment(input(), deps({ status: "created" }))).status, "pending");
  assert.equal((await verifyCheckoutPayment(input(), deps({ status: "failed" }))).status, "invalid");
});

test("checkPayment (used by the success page and webhook) applies the same rules without a signature", async () => {
  assert.equal((await checkPayment("order_1", "pay_1", deps())).status, "paid");
  assert.equal((await checkPayment("order_1", "pay_1", deps({ amount: 5 }))).status, "invalid");
});

test("malformed callback bodies are rejected", () => {
  assert.equal(parseVerifyInput(null), null);
  assert.equal(parseVerifyInput({ ...input(), razorpay_signature: "short" }), null);
  assert.equal(parseVerifyInput({ ...input(), razorpay_order_id: "../etc" }), null);
  assert.ok(parseVerifyInput(input()));
});

test("access token: valid, tampered, wrong-secret and expired", () => {
  const claims = { orderId: "order_1", paymentId: "pay_1", name: "Asha Rao" };
  const now = 1_000_000;
  const t = createAccessToken(claims, SECRET, now);
  assert.deepEqual(
    (({ o, p, n }) => ({ o, p, n }))(readAccessToken(t, SECRET, now + 1000)!),
    { o: "order_1", p: "pay_1", n: "Asha Rao" },
  );
  const [body, sig] = t.split(".");
  const forgedBody = Buffer.from(JSON.stringify({ o: "order_X", p: "pay_X", n: "x", e: now + 1e9 })).toString("base64url");
  assert.equal(readAccessToken(`${forgedBody}.${sig}`, SECRET, now), null);
  assert.equal(readAccessToken(t, "other_secret", now), null);
  assert.equal(readAccessToken(t, SECRET, now + 8 * 24 * 3600 * 1000), null);
  assert.equal(readAccessToken(undefined, SECRET), null);
  assert.equal(readAccessToken(`${body}`, SECRET), null);
});

test("webhook parsing: captured, order.paid, failed, ignored", () => {
  const pay = { id: "pay_1", order_id: "order_1", amount: 900, currency: "INR", status: "captured", email: "a@b.co", contact: "+919876543210" };
  assert.equal(parseWebhook({ event: "payment.captured", payload: { payment: { entity: pay } } }).kind, "paid");
  assert.equal(
    parseWebhook({ event: "order.paid", payload: { payment: { entity: pay }, order: { entity: { id: "order_1", status: "paid" } } } }).kind,
    "paid",
  );
  assert.equal(
    parseWebhook({ event: "order.paid", payload: { payment: { entity: pay }, order: { entity: { id: "order_1", status: "attempted" } } } }).kind,
    "ignored",
  );
  assert.equal(parseWebhook({ event: "payment.captured", payload: { payment: { entity: { ...pay, status: "authorized" } } } }).kind, "ignored");
  assert.equal(parseWebhook({ event: "payment.failed", payload: { payment: { entity: { ...pay, status: "failed" } } } }).kind, "failed");
  assert.equal(parseWebhook({ event: "refund.created" }).kind, "ignored");
});
