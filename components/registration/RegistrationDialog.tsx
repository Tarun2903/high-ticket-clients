"use client";

import { useState, type FormEvent, type MouseEvent, type Ref } from "react";
import { Icon } from "@/components/Icon";
import { startCheckout } from "@/lib/payment/client";
import { validateRegistration } from "@/lib/registration";
import { priceLabel, workshop } from "@/lib/workshop";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "cancelled" }
  | { kind: "unavailable"; message: string }
  | { kind: "error"; message: string };

type FieldErrors = Record<string, string>;

/**
 * Step between the CTA and payment: collects the details Razorpay prefill and
 * WhatsApp onboarding need, then hands over to startCheckout().
 */
export function RegistrationDialog({ ref }: { ref: Ref<HTMLDialogElement> }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [errors, setErrors] = useState<FieldErrors>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "submitting") return;
    const dialog = e.currentTarget.closest("dialog");

    const form = new FormData(e.currentTarget);
    const check = validateRegistration({ name: form.get("name"), email: form.get("email"), phone: form.get("phone") });
    if (!check.ok) {
      setErrors(check.errors as FieldErrors);
      return;
    }

    setErrors({});
    setState({ kind: "submitting" });
    // The Razorpay popup opens over the landing page. This dialog is a top-layer modal and would cover it,
    // so it closes first; if the customer cancels or the payment fails it comes back with the form still filled.
    const result = await startCheckout(check.details, { onBeforeOpen: () => dialog?.close() });

    if (result.status === "paid") return setState({ kind: "idle" }); // navigating to the confirmation page
    if (dialog && !dialog.open) dialog.showModal();
    if (result.status === "invalid") {
      setErrors(result.errors);
      return setState({ kind: "idle" });
    }
    setState(result.status === "cancelled" ? { kind: "cancelled" } : { kind: result.status, message: result.message });
  }

  function onBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) e.currentTarget.close();
  }

  const submitting = state.kind === "submitting";

  return (
    <dialog ref={ref} className="reg-dialog" aria-labelledby="reg-title" onClick={onBackdropClick}>
      <div className="reg-dialog__panel">
        <form method="dialog" className="reg-dialog__close-form">
          <button className="reg-dialog__close" aria-label="Close">
            <Icon name="x" size={20} />
          </button>
        </form>

        <p className="eyebrow eyebrow--dark">
          <span className="live-dot" aria-hidden="true" /> Secure your seat
        </p>
        <h2 id="reg-title" className="reg-dialog__title">
          {workshop.name}
        </h2>
        <ul className="reg-dialog__summary">
          <li>
            <Icon name="video" size={16} /> Live online
          </li>
          <li>
            <Icon name="clock" size={16} /> {workshop.durationMinutes} min
          </li>
          <li>
            <Icon name="calendar" size={16} /> {workshop.day}, {workshop.time}
          </li>
        </ul>

        {state.kind === "cancelled" && (
          <div className="notice notice--info" role="status">
            <Icon name="alert" size={20} />
            <p>Payment wasn&apos;t completed – you haven&apos;t been charged. Your details are saved, so you can try again below.</p>
          </div>
        )}
        {state.kind === "unavailable" && (
          <div className="notice notice--info" role="status">
            <Icon name="alert" size={20} />
            <p>{state.message}</p>
          </div>
        )}
        {state.kind === "error" && (
          <div className="notice notice--error" role="alert">
            <Icon name="alert" size={20} />
            <p>{state.message}</p>
          </div>
        )}

        <form className="reg-form" onSubmit={onSubmit} noValidate>
          <Field label="Full name" name="name" autoComplete="name" error={errors.name} />
          <Field
            label="WhatsApp number"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            hint="Workshop updates and joining details are shared on WhatsApp."
            error={errors.phone}
          />
          <Field
            label="Email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            error={errors.email}
          />

          <div className="reg-form__total">
            <span>Workshop access</span>
            <strong>{priceLabel}</strong>
          </div>

          <button type="submit" className="btn-cta btn-cta--lg btn-cta--block" disabled={submitting}>
            <span>{submitting ? "Please wait…" : state.kind === "cancelled" ? `TRY AGAIN – PAY ${priceLabel}` : `CONTINUE TO PAY ${priceLabel}`}</span>
            {!submitting && <Icon name="arrowRight" size={20} className="btn-cta__icon" />}
          </button>
          <p className="reg-form__secure">
            <Icon name="lock" size={14} /> Secure payment by Razorpay. After payment you&apos;ll get your confirmation and the
            workshop WhatsApp group link.
          </p>
        </form>
      </div>
    </dialog>
  );
}

function Field({
  label,
  name,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  hint,
  error,
}: {
  label: string;
  name: string;
  type?: string;
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
}) {
  const id = `reg-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {hint && !error && (
        <small id={`${id}-hint`} className="field__hint">
          {hint}
        </small>
      )}
      {error && (
        <small id={`${id}-error`} className="field__error">
          {error}
        </small>
      )}
    </div>
  );
}
