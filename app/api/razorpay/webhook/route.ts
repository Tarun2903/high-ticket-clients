// POST /api/razorpay/webhook – Razorpay webhook receiver (payment.captured, payment.failed, order.paid).
//
// Order of operations: signature on the RAW body -> parse -> dedupe by event id -> update Redis -> 200.
// Status codes: 401 bad/missing signature · 200 processed, duplicate or intentionally ignored ·
// 5xx = temporary/config problem, Razorpay retries automatically.
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/payment/signature";
import { redisConfigured, redisPaymentStore } from "@/lib/payment/store";
import { handleRazorpayEvent, type RazorpayEvent } from "@/lib/payment/webhook";
import { trackPurchase } from "@/lib/payment/purchase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 512 * 1024;

function reply(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Structured, PII-free logging: never log the body, signature, secrets, emails or phone numbers.
function log(level: "info" | "warn" | "error", msg: string, fields: Record<string, unknown> = {}) {
  console[level](JSON.stringify({ scope: "razorpay-webhook", msg, ...fields }));
}

export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET ?? "";
  if (!secret || !redisConfigured()) {
    log("error", "misconfigured: RAZORPAY_WEBHOOK_SECRET or Upstash Redis env vars missing");
    return reply({ status: "error" }, 503); // Razorpay will retry once this is fixed
  }

  // 1. Raw body – must be the exact bytes Razorpay signed (never req.json() before verifying).
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) return reply({ status: "too_large" }, 413);

  // 2. Signature.
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature, secret)) {
    log("warn", "invalid signature", { ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return reply({ status: "unauthorized" }, 401);
  }

  let evt: RazorpayEvent;
  try {
    evt = JSON.parse(rawBody) as RazorpayEvent;
  } catch {
    log("warn", "signed body is not valid JSON");
    return reply({ status: "bad_request" }, 400);
  }

  // 3. Idempotency key: Razorpay sends a stable id per event and reuses it on retries.
  const eventId =
    req.headers.get("x-razorpay-event-id") ?? `body_${createHash("sha256").update(rawBody).digest("hex")}`;
  const store = redisPaymentStore;

  try {
    const claim = await store.claimEvent(eventId);
    if (claim === "duplicate") {
      log("info", "duplicate event ignored", { eventId, event: evt.event });
      return reply({ status: "duplicate" }, 200);
    }
    if (claim === "busy") return reply({ status: "busy" }, 409); // same event in flight; Razorpay retries later

    try {
      const result = await handleRazorpayEvent(evt, store);
      if (result.outcome === "paid" && result.registrationId) {
        await trackPurchase(result.registrationId);
      }
      await store.completeEvent(eventId);
      const level = result.outcome === "amount_mismatch" || result.outcome === "order_mismatch" ? "error" : "info";
      log(level, "event processed", { eventId, event: evt.event, ...result });
      return reply({ status: "ok", outcome: result.outcome }, 200);
    } catch (err) {
      await store.releaseEvent(eventId).catch(() => {}); // let Razorpay's retry reprocess it
      throw err;
    }
  } catch (err) {
    log("error", "processing failed", { eventId, event: evt.event, error: err instanceof Error ? err.message : String(err) });
    return reply({ status: "error" }, 500);
  }
}
