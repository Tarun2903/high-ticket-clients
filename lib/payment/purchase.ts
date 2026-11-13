// Server-side Meta Purchase event – SERVER ONLY. The event_id is derived from the payment id, so the webhook
// and the browser Pixel share one id and Meta deduplicates them (no database needed for "send once").
import { sendCapiEvent } from "@/lib/meta";
import { workshopEventData } from "@/lib/workshop";

export const purchaseEventId = (paymentId: string) => `purchase_${paymentId}`;

export async function trackPurchase(p: {
  paymentId: string;
  email?: string;
  phone?: string;
  name?: string;
  eventSourceUrl?: string;
  fbp?: string;
  fbc?: string;
}): Promise<void> {
  try {
    const [firstName, ...rest] = (p.name ?? "").trim().split(/\s+/);
    const r = await sendCapiEvent({
      eventName: "Purchase",
      eventId: purchaseEventId(p.paymentId),
      eventSourceUrl: p.eventSourceUrl || process.env.NEXT_PUBLIC_SITE_URL || "",
      user: {
        email: p.email,
        phone: p.phone,
        firstName,
        lastName: rest.join(" ") || undefined,
        fbp: p.fbp,
        fbc: p.fbc,
      },
      customData: workshopEventData(),
    });
    if (!r.sent) console.info(JSON.stringify({ scope: "purchase", msg: "CAPI Purchase not sent", reason: r.error }));
  } catch (err) {
    console.warn(
      JSON.stringify({ scope: "purchase", msg: "CAPI Purchase failed", error: err instanceof Error ? err.message : String(err) }),
    );
  }
}
