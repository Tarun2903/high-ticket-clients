// POST /api/events – server-side (Conversions API) copy of browser events.
// Only non-purchase funnel events are accepted from the browser. Purchase is sent by the
// server itself after payment verification and can never be triggered from here.
import type { NextRequest } from "next/server";
import { fbcFromFbclid, sendCapiEvent } from "@/lib/meta";
import { workshopEventData } from "@/lib/workshop";

const ALLOWED_EVENTS = new Set(["ViewContent", "InitiateCheckout"]);

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  const eventName = typeof body.eventName === "string" ? body.eventName : "";
  const eventId = typeof body.eventId === "string" ? body.eventId.slice(0, 100) : "";
  if (!ALLOWED_EVENTS.has(eventName) || !eventId) return new Response(null, { status: 400 });

  const sourceUrl = typeof body.eventSourceUrl === "string" ? body.eventSourceUrl.slice(0, 2000) : req.nextUrl.origin;
  const fbclid = typeof body.fbclid === "string" ? body.fbclid.slice(0, 500) : undefined;

  const result = await sendCapiEvent({
    eventName,
    eventId,
    eventSourceUrl: sourceUrl,
    // No contact details for funnel events – only the technical signals Meta needs for matching.
    user: {
      clientIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      fbp: req.cookies.get("_fbp")?.value,
      fbc: req.cookies.get("_fbc")?.value ?? fbcFromFbclid(fbclid),
    },
    customData: workshopEventData(),
  });
  if (!result.sent && result.error !== "CAPI not configured") console.warn("[events] CAPI:", result.error);

  return new Response(null, { status: 204 });
}
