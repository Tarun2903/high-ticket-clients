// Server-side Meta Purchase event – SERVER ONLY. Call it ONLY from the single PENDING -> PAID transition
// (store.markPaid() === "paid_now"), from the verify route or the webhook, whichever wins the race.
import { sendCapiEvent } from "@/lib/meta";
import { workshopEventData } from "@/lib/workshop";
import { redisPaymentStore } from "./store";

export async function trackPurchase(registrationId: string): Promise<void> {
  try {
    const reg = await redisPaymentStore.getRegistration(registrationId);
    if (!reg?.purchaseEventId) return;
    const [firstName, ...rest] = (reg.name ?? "").split(/\s+/);
    const r = await sendCapiEvent({
      eventName: "Purchase",
      eventId: reg.purchaseEventId,
      eventSourceUrl: reg.eventSourceUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? "",
      user: { email: reg.email, phone: reg.phone, firstName, lastName: rest.join(" ") || undefined, fbp: reg.fbp, fbc: reg.fbc },
      customData: workshopEventData(),
    });
    if (!r.sent) console.warn(JSON.stringify({ scope: "purchase", msg: "CAPI Purchase not sent", registrationId, reason: r.error }));
  } catch (err) {
    console.warn(JSON.stringify({ scope: "purchase", msg: "CAPI Purchase failed", registrationId, error: err instanceof Error ? err.message : String(err) }));
  }
}
