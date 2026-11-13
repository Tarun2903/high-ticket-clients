// Single source of truth for the offer. Change the price here and every CTA,
// the checkout amount and the tracking value update together.

export const workshop = {
  name: "The High-Ticket Numerology Blueprint",
  host: "Melroy",
  format: "Live online workshop",
  durationMinutes: 90,
  day: "Sunday",
  time: "11:00 AM IST",
  /** Price in paise (₹1 = 100 paise). Razorpay orders are created server-side from this value only. */
  pricePaise: 900,
  currency: "INR",
} as const;

export function formatInr(paise: number): string {
  const rupees = paise / 100;
  return `₹${Number.isInteger(rupees) ? rupees.toLocaleString("en-IN") : rupees.toFixed(2)}`;
}

export const priceLabel = formatInr(workshop.pricePaise);
export const ctaLabel = `PAY ${priceLabel} & SECURE YOUR SEAT`;

/** Value/currency payload shared by Pixel and Conversions API events. */
export function workshopEventData() {
  return {
    content_name: workshop.name,
    content_type: "product",
    content_ids: ["htnb-workshop"],
    value: workshop.pricePaise / 100,
    currency: workshop.currency,
  };
}
