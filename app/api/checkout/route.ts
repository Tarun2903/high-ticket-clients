// POST /api/checkout – creates a payment order for a registration.
// Phase 1: validates input, then reports that payments are not live. No order, no charge.
import { NextResponse, type NextRequest } from "next/server";
import { validateRegistration } from "@/lib/registration";
import { sanitizeAttribution } from "@/lib/tracking/attribution";
import { createCheckoutOrder, PaymentsUnavailableError } from "@/lib/payment/server";
import type { CheckoutResponse } from "@/lib/payment/types";

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

  try {
    const order = await createCheckoutOrder(result.details, sanitizeAttribution(body.attribution));
    return json({ status: "ready", order }, 200);
  } catch (err) {
    if (err instanceof PaymentsUnavailableError) {
      return json({ status: "unavailable", message: UNAVAILABLE_MESSAGE }, 503);
    }
    console.error("[checkout] order creation failed:", err);
    return json({ status: "error", message: "Something went wrong. Please try again." }, 500);
  }
}

function json(body: CheckoutResponse, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
