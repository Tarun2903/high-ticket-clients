// UTM + fbclid attribution. Captured on landing, kept in sessionStorage and sent
// with the checkout request so it is stored against the order (Phase 2).

export const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];
export type Attribution = Partial<Record<AttributionKey, string>> & { landing_page?: string; captured_at?: string };

const STORAGE_KEY = "htnb_attribution";

/** Keeps only known keys with short string values. Safe on untrusted input (server side). */
export function sanitizeAttribution(input: unknown): Attribution {
  const src = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const out: Attribution = {};
  for (const key of [...ATTRIBUTION_KEYS, "landing_page", "captured_at"] as const) {
    const v = src[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, 500);
  }
  return out;
}

export function parseAttribution(search: string): Attribution {
  const params = new URLSearchParams(search);
  const out: Attribution = {};
  for (const key of ATTRIBUTION_KEYS) {
    const v = params.get(key);
    if (v) out[key] = v.slice(0, 500);
  }
  return out;
}

/** Browser only. A new ad click (URL with params) replaces the previous attribution. */
export function captureAttribution(): Attribution {
  const fromUrl = parseAttribution(window.location.search);
  if (Object.keys(fromUrl).length > 0) {
    const record: Attribution = {
      ...fromUrl,
      landing_page: window.location.pathname,
      captured_at: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    } catch {
      /* storage blocked (private mode / in-app browser) – attribution falls back to the URL */
    }
    return record;
  }
  return getAttribution();
}

export function getAttribution(): Attribution {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeAttribution(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return parseAttribution(window.location.search);
}
