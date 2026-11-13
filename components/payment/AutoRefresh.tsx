"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-runs the server page every few seconds while a verified payment is still being confirmed (webhook lag). */
export function AutoRefresh({ everyMs = 3000, maxTries = 40 }: { everyMs?: number; maxTries?: number }) {
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const id = setInterval(() => {
      if (++tries > maxTries) return clearInterval(id);
      router.refresh();
    }, everyMs);
    return () => clearInterval(id);
  }, [router, everyMs, maxTries]);
  return null;
}
