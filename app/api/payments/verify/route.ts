// POST /api/payments/verify – PHASE 2.
// Receives { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// from the Razorpay Checkout success handler. It must:
//   1. verifyPaymentSignature() (lib/payment/signature.ts) with RAZORPAY_KEY_SECRET
//   2. confirm the order belongs to registrationId and the amount matches workshop.pricePaise
//   3. mark the registration "paid" (idempotent – repeated calls do nothing new)
//   4. sendCapiEvent({ eventName: "Purchase", eventId: purchaseEventId, ... }) exactly once
//   5. return { redirect: `/payment/success?registration=${registrationId}` }
// Until then it refuses every request, so nothing can be marked as paid.
import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json(
    { status: "unavailable", message: "Payment verification is not enabled yet." },
    { status: 501, headers: { "Cache-Control": "no-store" } },
  );
}
