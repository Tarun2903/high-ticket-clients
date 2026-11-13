// Browser side of the registration/payment journey. The UI only calls startCheckout().
//
// Razorpay Checkout opens as a popup on top of the landing page – the page is never navigated away
// to pay. Only AFTER the server has verified the payment do we go to /payment/success.
// "Success" inside the popup is just a claim: it is sent to /api/payments/verify and nothing more.

import type { RegistrationDetails } from "@/lib/registration";
import { getAttribution } from "@/lib/tracking/attribution";
import type { CheckoutOrder, CheckoutRequest, CheckoutResponse } from "./types";

export type StartCheckoutResult =
  | { status: "paid" } // verified; the browser is navigating to the confirmation page
  | { status: "cancelled" } // popup closed without paying – safe to retry
  | { status: "unavailable"; message: string }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "error"; message: string };

export type StartCheckoutHooks = {
  /** Runs right before the popup opens (the page's own dialog must close first: it would cover the popup). */
  onBeforeOpen?: () => void;
};

type RazorpaySuccess = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayInstance = { open(): void; on(event: "payment.failed", cb: (r: unknown) => void): void };
type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

const CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
let scriptPromise: Promise<void> | null = null;

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const el = document.createElement("script");
    el.src = CHECKOUT_SRC;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => {
      el.remove();
      scriptPromise = null; // allow a later retry
      reject(new Error("checkout.js failed to load"));
    };
    document.head.appendChild(el);
  });
  return scriptPromise;
}

/** Warm the script on page load so the popup opens instantly on click. Failure is silent. */
export function preloadCheckout(): void {
  if (typeof window !== "undefined") void loadCheckoutScript().catch(() => {});
}

export async function startCheckout(
  details: RegistrationDetails,
  hooks: StartCheckoutHooks = {},
): Promise<StartCheckoutResult> {
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

  if (data.status !== "ready") return data;

  try {
    await loadCheckoutScript();
  } catch {
    return {
      status: "error",
      message: "The secure payment window couldn't load. Please check your connection (or disable ad-blockers) and try again.",
    };
  }
  return openRazorpay(data.order, hooks);
}

function openRazorpay(order: CheckoutOrder, hooks: StartCheckoutHooks): Promise<StartCheckoutResult> {
  return new Promise((resolve) => {
    let settled = false;
    let paid = false; // popup reported success; ignore the close event that follows it
    const finish = (r: StartCheckoutResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    const rzp = new window.Razorpay!({
      key: order.keyId, // public key id only; the secret never leaves the server
      order_id: order.orderId,
      amount: order.amountPaise,
      currency: order.currency,
      name: order.name,
      description: order.description,
      prefill: { name: order.prefill.name, email: order.prefill.email, contact: `+${order.prefill.contact}` },
      theme: { color: "#b8934a" },
      retry: { enabled: true },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          if (!paid) finish({ status: "cancelled" });
        },
      },
      handler: (response: RazorpaySuccess) => {
        paid = true;
        void confirmWithServer(order.registrationId, response).then(finish);
      },
    });

    // A failed attempt keeps the popup open with Razorpay's own "Retry" – nothing to do here.
    // Failure is recorded server-side by the signed webhook, never by this browser event.
    rzp.on("payment.failed", () => {});

    hooks.onBeforeOpen?.();
    rzp.open();
  });
}

/** Sends the popup's success claim to the server; navigates only if the server confirms it. */
async function confirmWithServer(registrationId: string, r: RazorpaySuccess): Promise<StartCheckoutResult> {
  const delays = [0, 1500, 4000]; // network blips: the payment is real, so keep asking the server
  for (const wait of delays) {
    if (wait) await new Promise((res) => setTimeout(res, wait));
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, ...r }),
      });
      if (res.status === 400 || res.status === 404) break; // rejected: retrying can't help
      if (res.ok || res.status === 202) {
        const data = (await res.json()) as { redirect?: string };
        window.location.assign(data.redirect ?? `/payment/success?registration=${registrationId}`);
        return { status: "paid" };
      }
    } catch {
      /* try again */
    }
  }
  return {
    status: "error",
    message:
      "We couldn't confirm your payment yet. If money was debited, please don't pay again – it will be confirmed automatically, or contact us with your payment ID: " +
      r.razorpay_payment_id,
  };
}
