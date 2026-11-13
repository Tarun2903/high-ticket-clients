// Registration details collected before payment (used for Razorpay prefill,
// WhatsApp onboarding and following up on abandoned payments).

export type RegistrationDetails = {
  name: string;
  email: string;
  /** Digits only, with country code, e.g. 919876543210. */
  phone: string;
};

export type RegistrationValidation =
  | { ok: true; details: RegistrationDetails }
  | { ok: false; errors: Partial<Record<keyof RegistrationDetails | "form", string>> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Accepts Indian 10-digit mobiles (adds 91) or full international numbers. */
export function normalizeWhatsApp(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10 && /^[6-9]/.test(digits)) return `91${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

export function validateRegistration(input: unknown): RegistrationValidation {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const errors: Partial<Record<keyof RegistrationDetails, string>> = {};

  const name = str(body.name, 120).replace(/\s+/g, " ");
  const email = str(body.email, 200).toLowerCase();
  const phone = normalizeWhatsApp(str(body.phone, 40));

  if (name.length < 2) errors.name = "Please enter your full name.";
  if (!EMAIL_RE.test(email)) errors.email = "Please enter a valid email address.";
  if (!phone) errors.phone = "Please enter a valid WhatsApp number.";

  if (Object.keys(errors).length > 0 || !phone) return { ok: false, errors };
  return { ok: true, details: { name, email, phone } };
}
