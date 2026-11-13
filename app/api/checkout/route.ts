// POST /api/checkout – creates (or reuses) the Razorpay order; customer details are stored as order notes.
// The amount comes from lib/workshop.ts on the server; the browser can't influence it.
import { NextResponse, type NextRequest } from "next/server";
import { fbcFromFbclid } from "@/lib/meta";
import { validateRegistration } from "@/lib/registration";
import { sanitizeAttribution } from "@/lib/tracking/attribution";
import { AlreadyRegisteredError, createCheckoutOrder, PaymentsUnavailableError } from "@/lib/payment/server";
import type { CheckoutResponse } from "@/lib/payment/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UNAVAILABLE_MESSAGE =
  "Online registration isn't open yet. We're finishing secure payments – please check back shortly.";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ status: "error", message: "Invalid request." }, 400);
  }

  const result = validateRegistration(body.details);
  if (!result.ok) return json({ status: "invalid", errors: result.errors as Record<string, string> }, 400);

  const attribution = sanitizeAttribution(body.attribution);
  const eventSourceUrl = typeof body.eventSourceUrl === "string" ? body.eventSourceUrl.slice(0, 500) : undefined;

  try {
    const order = await createCheckoutOrder(result.details, attribution, {
      eventSourceUrl,
      fbp: req.cookies.get("_fbp")?.value,
      fbc: req.cookies.get("_fbc")?.value ?? fbcFromFbclid(attribution.fbclid),
    });
    return json({ status: "ready", order }, 200);
  } catch (err) {
    if (err instanceof PaymentsUnavailableError) return json({ status: "unavailable", message: UNAVAILABLE_MESSAGE }, 503);
    if (err instanceof AlreadyRegisteredError) {
      return json(
        { status: "error", message: "You're already registered with these details. Check your WhatsApp, or contact us if you need help." },
        409,
      );
    }
    console.error(JSON.stringify({ scope: "checkout", msg: "order creation failed", error: err instanceof Error ? err.message : String(err) }));
    return json({ status: "error", message: "Something went wrong. Please try again." }, 500);
  }
}

function json(body: CheckoutResponse, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
