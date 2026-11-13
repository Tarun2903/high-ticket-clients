// Server-side Meta Conversions API (CAPI) helpers.
// Browser Pixel + server CAPI events share the same event_id so Meta deduplicates them.
import { createHash } from "node:crypto";

export type CapiUser = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
};

export type CapiEvent = {
  eventName: string;
  eventId: string;
  eventSourceUrl: string;
  user: CapiUser;
  customData?: Record<string, unknown>;
  eventTime?: number;
};

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Digits only, country code included (Meta's required format). */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Builds the _fbc value from an fbclid URL param when the cookie isn't set yet. */
export function fbcFromFbclid(fbclid: string | undefined, now = Date.now()): string | undefined {
  if (!fbclid) return undefined;
  return `fb.1.${now}.${fbclid}`;
}

export function buildCapiPayload(event: CapiEvent, testEventCode?: string) {
  const { user } = event;
  const hashed = (v: string | undefined, normalize: (s: string) => string) =>
    v && normalize(v) ? [sha256(normalize(v))] : undefined;

  const userData: Record<string, unknown> = {
    em: hashed(user.email, normalizeEmail),
    ph: hashed(user.phone, normalizePhone),
    fn: hashed(user.firstName, normalizeName),
    ln: hashed(user.lastName, normalizeName),
    client_ip_address: user.clientIp,
    client_user_agent: user.userAgent,
    fbp: user.fbp,
    fbc: user.fbc,
  };
  for (const key of Object.keys(userData)) {
    if (userData[key] === undefined) delete userData[key];
  }

  return {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: "website",
        user_data: userData,
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };
}

export async function sendCapiEvent(event: CapiEvent): Promise<{ sent: boolean; error?: string }> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!pixelId || !token) return { sent: false, error: "CAPI not configured" };

  const version = process.env.META_GRAPH_API_VERSION || "v23.0";
  const payload = buildCapiPayload(event, process.env.META_TEST_EVENT_CODE || undefined);

  try {
    const res = await fetch(`https://graph.facebook.com/${version}/${pixelId}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, access_token: token }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { sent: false, error: `CAPI ${res.status}: ${await res.text()}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : String(err) };
  }
}
