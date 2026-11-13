// Browser-side event tracking.
//
// Event plan:
//   PageView          – fired by the Pixel base code on every page load (components/Analytics.tsx)
//   ViewContent       – landing page viewed           -> trackEvent("ViewContent")
//   InitiateCheckout  – registration/payment started  -> trackEvent("InitiateCheckout")
//   Purchase          – ONLY after the backend has verified the Razorpay signature.
//                       Server fires it via CAPI; the success page fires the browser
//                       copy with the same event_id (trackVerifiedPurchase). Never from a CTA.
//
// Every browser event carries an event_id that is also sent to /api/events, so the
// Conversions API copy is deduplicated by Meta.

import { workshopEventData } from "@/lib/workshop";
import { getAttribution } from "./attribution";

export type BrowserEvent = "ViewContent" | "InitiateCheckout";

type FbqArgs = Parameters<NonNullable<Window["fbq"]>>;

const firedThisPage = new Set<string>();

export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Calls fbq, or queues the call until the Pixel base code has loaded. */
function pixel(...args: FbqArgs) {
  if (window.fbq) {
    window.fbq(...args);
  } else if (window.__pxq !== null) {
    (window.__pxq ??= []).push(args);
  }
}

function pushDataLayer(event: string, data: Record<string, unknown>) {
  if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event, ...data });
}

/** Fires a browser event (Pixel + dataLayer) and its server-side CAPI twin. Once per page load. */
export function trackEvent(name: BrowserEvent): void {
  if (typeof window === "undefined" || firedThisPage.has(name)) return;
  firedThisPage.add(name);

  const eventId = newEventId();
  const data = workshopEventData();
  pixel("track", name, data, { eventID: eventId });
  pushDataLayer(name, { event_id: eventId, ...data });

  const payload = JSON.stringify({
    eventName: name,
    eventId,
    eventSourceUrl: window.location.href,
    fbclid: getAttribution().fbclid,
  });
  try {
    const sent = navigator.sendBeacon?.("/api/events", new Blob([payload], { type: "application/json" }));
    if (!sent) void fetch("/api/events", { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "application/json" } });
  } catch {
    /* tracking must never break the page */
  }
}

/**
 * Browser copy of the Purchase event. Call ONLY from the verified payment-success page,
 * with the event_id the server used for its CAPI Purchase event. Guarded so a page
 * refresh never double-counts.
 */
export function trackVerifiedPurchase(eventId: string, valueRupees: number, currency: string): void {
  if (typeof window === "undefined") return;
  const key = `htnb_purchase_${eventId}`;
  try {
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
  } catch {
    if (firedThisPage.has(key)) return;
  }
  firedThisPage.add(key);
  const data = { ...workshopEventData(), value: valueRupees, currency };
  pixel("track", "Purchase", data, { eventID: eventId });
  pushDataLayer("Purchase", { event_id: eventId, ...data });
}
