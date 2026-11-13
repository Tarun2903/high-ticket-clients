"use client";

import { ctaLabel } from "@/lib/workshop";
import { Icon } from "@/components/Icon";
import { useRegistration } from "./RegistrationProvider";

type Props = {
  size?: "md" | "lg";
  block?: boolean;
  className?: string;
};

/** Every "PAY ₹9 & SECURE YOUR SEAT" button on the site. Same label, same action. */
export function RegisterButton({ size = "md", block = false, className = "" }: Props) {
  const { openRegistration } = useRegistration();
  return (
    <button
      type="button"
      className={`btn-cta btn-cta--${size}${block ? " btn-cta--block" : ""} ${className}`}
      onClick={openRegistration}
      aria-haspopup="dialog"
    >
      <span>{ctaLabel}</span>
      <Icon name="arrowRight" size={size === "lg" ? 20 : 18} className="btn-cta__icon" />
    </button>
  );
}
