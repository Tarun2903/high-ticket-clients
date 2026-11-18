import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { formatInr, workshop } from "../lib/workshop.ts";
import { normalizeWhatsApp, validateRegistration } from "../lib/registration.ts";
import { parseAttribution, sanitizeAttribution } from "../lib/tracking/attribution.ts";
import { verifyPaymentSignature, verifyWebhookSignature } from "../lib/payment/signature.ts";
import { buildCapiPayload, fbcFromFbclid, META_PIXEL_ID, sha256 } from "../lib/meta.ts";

test("price is ₹9 and formats correctly", () => {
  assert.equal(workshop.pricePaise, 900);
  assert.equal(formatInr(900), "₹9");
  assert.equal(formatInr(49900), "₹499");
  assert.equal(formatInr(950), "₹9.50");
});

test("WhatsApp numbers normalise to digits with country code", () => {
  assert.equal(normalizeWhatsApp("98765 43210"), "919876543210");
  assert.equal(normalizeWhatsApp("+91 98765-43210"), "919876543210");
  assert.equal(normalizeWhatsApp("098765 43210"), "919876543210");
  assert.equal(normalizeWhatsApp("+44 7700 900123"), "447700900123");
  assert.equal(normalizeWhatsApp("12345"), null);
});

test("registration validation", () => {
  const ok = validateRegistration({ name: "  Asha   Rao ", email: "Asha@Example.com", phone: "9876543210" });
  assert.deepEqual(ok, { ok: true, details: { name: "Asha Rao", email: "asha@example.com", phone: "919876543210" } });

  const bad = validateRegistration({ name: "A", email: "nope", phone: "1" });
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.deepEqual(Object.keys(bad.errors).sort(), ["email", "name", "phone"]);

  assert.equal(validateRegistration(null).ok, false);
});

test("attribution keeps only known UTM/fbclid keys", () => {
  assert.deepEqual(parseAttribution("?utm_source=fb&utm_campaign=c1&fbclid=XYZ&foo=bar"), {
    utm_source: "fb",
    utm_campaign: "c1",
    fbclid: "XYZ",
  });
  assert.deepEqual(sanitizeAttribution({ utm_medium: "paid", evil: "<script>", utm_term: 5 }), { utm_medium: "paid" });
  assert.deepEqual(sanitizeAttribution("junk"), {});
});

test("Razorpay payment signature verification", () => {
  const secret = "test_secret";
  const signature = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
  assert.equal(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature }, secret), true);
  assert.equal(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_2", signature }, secret), false);
  assert.equal(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature: "short" }, secret), false);
  assert.equal(verifyPaymentSignature({ orderId: "order_1", paymentId: "pay_1", signature }, ""), false);
});

test("Razorpay webhook signature verification", () => {
  const body = '{"event":"payment.captured"}';
  const sig = createHmac("sha256", "wh").update(body).digest("hex");
  assert.equal(verifyWebhookSignature(body, sig, "wh"), true);
  assert.equal(verifyWebhookSignature(body + " ", sig, "wh"), false);
});

test("CAPI payload: funnel events carry no PII, purchase PII is hashed", () => {
  const funnel = buildCapiPayload({
    eventName: "InitiateCheckout",
    eventId: "e1",
    eventSourceUrl: "https://x",
    user: { clientIp: "1.1.1.1", userAgent: "UA" },
  }).data[0];
  assert.equal(funnel.event_id, "e1");
  assert.deepEqual(Object.keys(funnel.user_data).sort(), ["client_ip_address", "client_user_agent"]);

  const purchase = buildCapiPayload({
    eventName: "Purchase",
    eventId: "p1",
    eventSourceUrl: "https://x",
    user: { email: " A@B.com ", phone: "+91 98765 43210" },
  }).data[0];
  assert.deepEqual(purchase.user_data.em, [sha256("a@b.com")]);
  assert.deepEqual(purchase.user_data.ph, [sha256("919876543210")]);
  assert.equal(fbcFromFbclid("abc", 1), "fb.1.1.abc");
});

test("Meta Pixel ID defaults to the workshop pixel", () => {
  if (!process.env.NEXT_PUBLIC_META_PIXEL_ID) assert.equal(META_PIXEL_ID, "1571576558333946");
  assert.match(META_PIXEL_ID, /^\d+$/);
});

test("CAPI Lead carries hashed contact details and the browser event_id", () => {
  const lead = buildCapiPayload({
    eventName: "Lead",
    eventId: "lead-123",
    eventSourceUrl: "https://x",
    user: { email: "asha@example.com", phone: "919876543210", firstName: "Asha", lastName: "Rao", fbp: "fb.1.1.1" },
  }).data[0];
  assert.equal(lead.event_name, "Lead");
  assert.equal(lead.event_id, "lead-123");
  assert.deepEqual(lead.user_data.em, [sha256("asha@example.com")]);
  assert.deepEqual(lead.user_data.fn, [sha256("asha")]);
  assert.equal(lead.user_data.fbp, "fb.1.1.1");
});
