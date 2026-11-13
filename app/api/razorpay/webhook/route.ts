// POST /api/razorpay/webhook – Razorpay webhook receiver (payment.captured, payment.failed, order.paid).
//
// Order of operations: signature on the RAW body -> parse -> (for captures) confirm with Razorpay -> 200.
// There is nothing to "update": Razorpay is the record of every order and payment. Handling is naturally
// idempotent – replays only re-confirm, and the Purchase event_id is derived from the payment id so Meta
// deduplicates it.
// Status codes: 401 bad/missing signature · 200 processed or intentionally ignored ·
// 5xx = temporary/config problem, Razorpay retries automatically.
import { NextResponse, type NextRequest } from "next/server";
import { trackPurchase } from "@/lib/payment/purchase";
import { EXPECTED, loadOrder, paymentConfig } from "@/lib/payment/server";
import { verifyWebhookSignature } from "@/lib/payment/signature";
import { checkPayment } from "@/lib/payment/verify";
import { fetchPayment } from "@/lib/payment/razorpay";
import { parseWebhook, type WebhookEvent } from "@/lib/payment/webhook";

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
  const { webhookSecret } = paymentConfig();
  if (!webhookSecret) {
    log("error", "misconfigured: RAZORPAY_WEBHOOK_SECRET missing");
    return reply({ status: "error" }, 503); // Razorpay retries once this is fixed
  }

  // 1. Raw body – the exact bytes Razorpay signed (never req.json() before verifying).
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody) > MAX_BODY_BYTES) return reply({ status: "too_large" }, 413);

  // 2. Signature.
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    log("warn", "invalid signature", { ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return reply({ status: "unauthorized" }, 401);
  }

  let evt: WebhookEvent;
  try {
    evt = JSON.parse(rawBody) as WebhookEvent;
  } catch {
    log("warn", "signed body is not valid JSON");
    return reply({ status: "bad_request" }, 400);
  }

  const eventId = req.headers.get("x-razorpay-event-id") ?? undefined;
  const parsed = parseWebhook(evt);

  try {
    if (parsed.kind === "failed") {
      log("info", "payment failed", { eventId, orderId: parsed.orderId, paymentId: parsed.paymentId, reason: parsed.reason });
      return reply({ status: "ok", outcome: "failed_recorded" }, 200);
    }
    if (parsed.kind === "ignored") {
      log("info", "event ignored", { eventId, event: parsed.event });
      return reply({ status: "ok", outcome: "ignored" }, 200);
    }

    // Captured payment: confirm with Razorpay that it is OUR order, OUR amount and really captured.
    const check = await checkPayment(parsed.orderId, parsed.paymentId, {
      expected: EXPECTED,
      fetchPayment,
      fetchOrder: loadOrder,
    });
    if (check.status !== "paid") {
      log("warn", "captured event did not match this workshop's order", { eventId, orderId: parsed.orderId, result: check.status });
      return reply({ status: "ok", outcome: "not_this_workshop" }, 200); // 200: retrying can't change the answer
    }

    const order = await loadOrder(parsed.orderId);
    await trackPurchase({
      paymentId: parsed.paymentId,
      email: parsed.email ?? order.notes.email,
      phone: parsed.contact ?? order.notes.phone,
      name: order.notes.name,
      eventSourceUrl: order.notes.source_url,
      fbp: order.notes.fbp,
      fbc: order.notes.fbc,
    });
    log("info", "payment confirmed", { eventId, orderId: parsed.orderId, paymentId: parsed.paymentId });
    return reply({ status: "ok", outcome: "paid" }, 200);
  } catch (err) {
    log("error", "processing failed", { eventId, event: evt.event, error: err instanceof Error ? err.message : String(err) });
    return reply({ status: "error" }, 500); // Razorpay will retry
  }
}
