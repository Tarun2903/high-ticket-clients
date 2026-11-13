// Thank-you page. Renders the confirmation and the WhatsApp group link ONLY when
//   (a) Razorpay itself confirms the payment as captured, for our order and amount (live check), and
//   (b) this browser holds the signed access cookie the verify route issued after the payment.
// Typing or sharing the URL proves nothing: without both, you only get the "couldn't confirm" state.
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { WhatsAppLogo } from "@/components/WhatsAppLogo";
import { AutoRefresh } from "@/components/payment/AutoRefresh";
import { PurchaseTracker } from "@/components/tracking/PurchaseTracker";
import { ACCESS_COOKIE, getRegistrationView, whatsappGroupUrl } from "@/lib/payment/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registration confirmed", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ order?: string; preview?: string }> };

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { order, preview } = await searchParams;
  const token = (await cookies()).get(ACCESS_COOKIE)?.value;
  const view = await getRegistrationView(order, token);

  // Local design review only: `next dev` + ?preview=1. Never available in production builds.
  const isDesignPreview = view.state !== "paid" && preview === "1" && process.env.NODE_ENV === "development";

  if (view.state === "pending") {
    return (
      <StatusShell>
        <AutoRefresh />
        <span className="status__icon status__icon--pending">
          <Icon name="clock" size={28} />
        </span>
        <h1 className="display status__title">Confirming your payment…</h1>
        <p className="status__text">
          This usually takes a few seconds. Please keep this page open – it will update by itself. You don&apos;t need to
          pay again.
        </p>
      </StatusShell>
    );
  }

  if (view.state === "none" && !isDesignPreview) {
    return (
      <StatusShell>
        <span className="status__icon status__icon--pending">
          <Icon name="clock" size={28} />
        </span>
        <h1 className="display status__title">We couldn&apos;t confirm your payment</h1>
        <p className="status__text">
          This page is only available right after a successful payment, in the same browser. If you were charged,
          please <Link href="/contact">contact us</Link> with your payment ID and we&apos;ll sort it out immediately.
        </p>
        <div className="status__actions">
          <Link className="btn-cta btn-cta--md" href="/">
            <span>Back to the workshop page</span>
          </Link>
        </div>
      </StatusShell>
    );
  }

  const paid = view.state === "paid" ? view.registration : null;
  const groupUrl = whatsappGroupUrl();
  const name = paid?.name || "Preview Customer";
  const paymentId = paid?.paymentId ?? "pay_PREVIEW";

  return (
    <StatusShell>
      {isDesignPreview && <p className="preview-banner">DESIGN PREVIEW – not a real registration. No events fired.</p>}
      {paid && <PurchaseTracker eventId={paid.purchaseEventId} value={paid.amountPaise / 100} currency={paid.currency} />}

      <span className="status__icon status__icon--success status__icon--animated">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path className="check-draw" d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h1 className="display status__title">Congratulations! Your Registration Is Confirmed.</h1>
      <p className="status__text">
        Thank you for registering for the High-Ticket Numerology Workshop. Your payment has been successfully received.
      </p>
      <p className="status__text">You are just one step away from joining the workshop community.</p>

      <dl className="status__summary">
        <div>
          <dt>Status</dt>
          <dd className="status__paid">PAID / CONFIRMED</dd>
        </div>
        <div>
          <dt>Name</dt>
          <dd>{name}</dd>
        </div>
        <div>
          <dt>Payment ID</dt>
          <dd className="status__mono">{paymentId}</dd>
        </div>
      </dl>

      <section className="next-step" aria-labelledby="next-step-title">
        <h2 id="next-step-title" className="display next-step__title">
          Your Next Step: Join the Official WhatsApp Group
        </h2>
        <p className="status__text">
          Join our exclusive WhatsApp group to receive important workshop updates, joining instructions, announcements,
          and other essential information.
        </p>
        <div className="status__actions">
          {groupUrl && paid ? (
            <a className="btn-cta btn-cta--lg btn-cta--block btn-whatsapp" href={groupUrl} target="_blank" rel="noopener noreferrer">
              <WhatsAppLogo size={22} />
              <span>JOIN THE WHATSAPP GROUP</span>
            </a>
          ) : (
            <button className="btn-cta btn-cta--lg btn-cta--block btn-whatsapp" type="button" disabled>
              <WhatsAppLogo size={22} />
              <span>JOIN THE WHATSAPP GROUP</span>
            </button>
          )}
        </div>
        <p className="next-step__note">Please make sure you join the group so you don&apos;t miss any important updates.</p>
      </section>
    </StatusShell>
  );
}

function StatusShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="status">
      <div className="status__card">{children}</div>
    </main>
  );
}
