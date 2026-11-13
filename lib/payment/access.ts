// Signed, expiring access token for the thank-you page – SERVER ONLY, pure (the secret is passed in).
// Issued by /api/payments/verify only after the payment has been verified; kept in an httpOnly cookie.
// The page still re-checks the payment with Razorpay, so the token alone never proves payment.
import { createHmac, timingSafeEqual } from "node:crypto";

export type AccessClaims = { o: string; p: string; n: string; e: number };

const DAY = 24 * 60 * 60 * 1000;
const sign = (body: string, secret: string) => createHmac("sha256", secret).update(`access|${body}`).digest("hex");

export function createAccessToken(
  claims: { orderId: string; paymentId: string; name: string },
  secret: string,
  now = Date.now(),
  ttlMs = 7 * DAY,
): string {
  const payload: AccessClaims = { o: claims.orderId, p: claims.paymentId, n: claims.name.slice(0, 100), e: now + ttlMs };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function readAccessToken(token: string | undefined, secret: string, now = Date.now()): AccessClaims | null {
  if (!token || !secret) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const expected = Buffer.from(sign(body, secret));
  const got = Buffer.from(sig);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const c = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AccessClaims;
    if (typeof c.o !== "string" || typeof c.p !== "string" || typeof c.e !== "number" || c.e < now) return null;
    return { ...c, n: typeof c.n === "string" ? c.n : "" };
  } catch {
    return null;
  }
}
