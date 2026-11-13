// Browser side of the registration/payment journey. The UI only calls startCheckout().

import type { RegistrationDetails } from "@/lib/registration";
import { getAttribution } from "@/lib/tracking/attribution";
import type { CheckoutOrder, CheckoutRequest, CheckoutResponse } from "./types";

export type StartCheckoutResult =
  | { status: "opened" }
  | { status: "unavailable"; message: string }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "error"; message: string };

export async function startCheckout(details: RegistrationDetails): Promise<StartCheckoutResult> {
  const body: CheckoutRequest = {
    details,
    attribution: getAttribution(),
    eventSourceUrl: window.location.href,
  };

  let data: CheckoutResponse;
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    data = (await res.json()) as CheckoutResponse;
  } catch {
    return { status: "error", message: "We couldn't reach the server. Please check your connection and try again." };
  }

  if (data.status === "ready") return openProviderCheckout(data.order);
  return data;
}

/**
 * PHASE 2: open Razorpay Checkout.
 *   - load https://checkout.razorpay.com/v1/checkout.js (once)
 *   - new Razorpay({ key: order.keyId, order_id: order.orderId, amount: order.amountPaise,
 *       currency: order.currency, name: order.name, description: order.description,
 *       prefill: order.prefill,
 *       handler: (r) => POST /api/payments/verify { registrationId, ...r } then
 *                       window.location.assign(`/payment/success?registration=${registrationId}`),
 *       modal: { ondismiss: () => resolve "dismissed" } }).open()
 *   - payment.failed -> window.location.assign("/payment/failed")
 * Returning to the site alone never marks a registration as paid; the success page re-checks the server.
 */
async function openProviderCheckout(_order: CheckoutOrder): Promise<StartCheckoutResult> {
  return { status: "unavailable", message: "Online payment is not live yet." };
}
