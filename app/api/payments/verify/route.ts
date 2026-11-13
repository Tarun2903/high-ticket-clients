// POST /api/payments/verify – called by the browser right after the Razorpay popup reports success.
// Body: { registrationId, razorpay_order_id, razorpay_payment_id, razorpay_signature }.
// Nothing here trusts the browser: see lib/payment/verify.ts. On success it sets the signed access
// cookie that lets this browser (and only this browser) open /payment/success.
import { NextResponse, type NextRequest } from "next/server";
import { verifyPaymentSignature } from "@/lib/payment/signature";
import { trackPurchase } from "@/lib/payment/purchase";
import {
  ACCESS_COOKIE,
  ACCESS_COOKIE_MAX_AGE,
  createAccessToken,
  fetchRazorpayPayment,
  paymentConfig,
  paymentsEnabled,
} from "@/lib/payment/server";
import { redisConfigured, redisPaymentStore } from "@/lib/payment/store";
import { parseVerifyInput, verifyCheckoutPayment } from "@/lib/payment/verify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (body: Record<string, unknown>, status: number) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  if (!paymentsEnabled() || !redisConfigured()) return reply({ status: "unavailable" }, 503);

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
      store: redisPaymentStore,
      verifySignature: (p) => verifyPaymentSignature(p, paymentConfig().keySecret),
      fetchPayment: fetchRazorpayPayment,
      onPaidNow: trackPurchase,
    });

    if (result.status === "paid") {
      const res = reply({ status: "paid", redirect: `/payment/success?registration=${result.registrationId}` }, 200);
      res.cookies.set(ACCESS_COOKIE, createAccessToken(result.registrationId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_COOKIE_MAX_AGE,
      });
      return res;
    }
    if (result.status === "pending") {
      // Payment not captured yet: give the browser its access cookie so the success page can wait for the webhook.
      const res = reply({ status: "pending", redirect: `/payment/success?registration=${input.registrationId}` }, 202);
      res.cookies.set(ACCESS_COOKIE, createAccessToken(input.registrationId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_COOKIE_MAX_AGE,
      });
      return res;
    }
    if (result.status === "not_found") return reply({ status: "not_found" }, 404);
    console.warn(JSON.stringify({ scope: "verify", msg: "verification rejected", registrationId: input.registrationId }));
    return reply({ status: "invalid" }, 400);
  } catch (err) {
    console.error(JSON.stringify({ scope: "verify", msg: "verification error", error: err instanceof Error ? err.message : String(err) }));
    return reply({ status: "error" }, 502); // temporary: the browser retries, the webhook is the backup
  }
}
