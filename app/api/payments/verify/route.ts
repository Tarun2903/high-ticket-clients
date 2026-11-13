// POST /api/payments/verify – called by the browser right after the Razorpay popup reports success.
// Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }.
// Nothing here trusts the browser: see lib/payment/verify.ts. On success it sets the signed access
// cookie that lets this browser (and only this browser) open /payment/success.
import { NextResponse, type NextRequest } from "next/server";
import { verifyPaymentSignature } from "@/lib/payment/signature";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  createAccessToken,
  EXPECTED,
  fetchPayment,
  loadOrder,
  paymentConfig,
  paymentsEnabled,
} from "@/lib/payment/server";
import { parseVerifyInput, verifyCheckoutPayment } from "@/lib/payment/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  if (!paymentsEnabled()) return reply({ status: "unavailable" }, 503);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return reply({ status: "invalid" }, 400);
  }
  const input = parseVerifyInput(raw);
  if (!input) return reply({ status: "invalid" }, 400);

  try {
    const result = await verifyCheckoutPayment(input, {
      expected: EXPECTED,
      verifySignature: (p) => verifyPaymentSignature(p, paymentConfig().keySecret),
      fetchPayment,
      fetchOrder: loadOrder,
    });

    if (result.status === "invalid") {
      console.warn(JSON.stringify({ scope: "verify", msg: "verification rejected", orderId: input.razorpay_order_id }));
      return reply({ status: "invalid" }, 400);
    }

    // paid, or signature-valid but not captured yet (success page waits for it). Either way this browser gets its cookie.
    const res = reply(
      { status: result.status, redirect: `/payment/success?order=${encodeURIComponent(result.orderId)}` },
      result.status === "paid" ? 200 : 202,
    );
    res.cookies.set(ACCESS_COOKIE, createAccessToken(result), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_COOKIE_MAX_AGE,
    });
    return res;
  } catch (err) {
    console.error(JSON.stringify({ scope: "verify", msg: "verification error", error: err instanceof Error ? err.message : String(err) }));
    return reply({ status: "error" }, 502); // temporary: the browser retries, the webhook is the backup
  }
}
