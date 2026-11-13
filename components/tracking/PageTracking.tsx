"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/tracking/attribution";
import { trackEvent } from "@/lib/tracking/client";

/** Landing page only: stores UTM/fbclid for checkout and fires ViewContent once. */
export function PageTracking() {
  useEffect(() => {
    captureAttribution();
    trackEvent("ViewContent");
  }, []);
  return null;
}
