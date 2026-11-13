"use client";

import { useEffect } from "react";
import { trackVerifiedPurchase } from "@/lib/tracking/client";

/**
 * Rendered ONLY by the payment-success page after the server has verified the payment.
 * Uses the server's Purchase event_id so Pixel + CAPI deduplicate.
 */
export function PurchaseTracker({ eventId, value, currency }: { eventId: string; value: number; currency: string }) {
  useEffect(() => {
    trackVerifiedPurchase(eventId, value, currency);
  }, [eventId, value, currency]);
  return null;
}
