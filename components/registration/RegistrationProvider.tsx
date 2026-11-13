"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import { preloadCheckout } from "@/lib/payment/client";
import { trackEvent } from "@/lib/tracking/client";
import { RegistrationDialog } from "./RegistrationDialog";

type RegistrationContextValue = { openRegistration: () => void };

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

/**
 * The ONE registration action used by every CTA on the page.
 * Opening it starts the payment journey (InitiateCheckout); payment itself is handled
 * by lib/payment/client.ts from inside the dialog.
 */
export function RegistrationProvider({ children }: { children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const openRegistration = useCallback(() => {
    trackEvent("InitiateCheckout");
    preloadCheckout();
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <RegistrationContext.Provider value={{ openRegistration }}>
      {children}
      <RegistrationDialog ref={dialogRef} />
    </RegistrationContext.Provider>
  );
}

export function useRegistration(): RegistrationContextValue {
  const ctx = useContext(RegistrationContext);
  if (!ctx) throw new Error("useRegistration must be used inside <RegistrationProvider>");
  return ctx;
}
