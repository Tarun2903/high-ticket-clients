// POST /api/payments/webhook – PHASE 2 (Razorpay webhook: payment.captured / order.paid).
// Read the raw body (await req.text()), check X-Razorpay-Signature with
// verifyWebhookSignature() and RAZORPAY_WEBHOOK_SECRET, then mark the registration paid
// using the same idempotent logic as /api/payments/verify. Backup for users who close
// the tab before the Checkout handler runs.
import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json({ status: "unavailable" }, { status: 501 });
}
