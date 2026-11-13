// Payment-success page. Shows the WhatsApp group ONLY for a registration whose payment the
// server has verified. Arriving here (e.g. back button, shared link) proves nothing on its own.
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { PurchaseTracker } from "@/components/tracking/PurchaseTracker";
import { getVerifiedRegistration, whatsappGroupUrl } from "@/lib/payment/server";
import { workshop } from "@/lib/workshop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registration status", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ registration?: string; preview?: string }> };

export default async function PaymentSuccessPage({ searchParams }: Props) {
  const { registration, preview } = await searchParams;
  const verified = await getVerifiedRegistration(registration);

  // Local design review only: `next dev` + ?preview=1. Never available in production builds.
  const isDesignPreview = !verified && preview === "1" && process.env.NODE_ENV === "development";

  if (!verified && !isDesignPreview) {
    return (
      <StatusShell>
        <span className="status__icon status__icon--pending">
          <Icon name="clock" size={28} />
        </span>
        <h1 className="display status__title">We couldn&apos;t confirm your payment yet</h1>
        <p className="status__text">
          If you completed the payment, it may take a moment to confirm. Please refresh this page in a minute. If you
          weren&apos;t charged, you can register again.
        </p>
        <div className="status__actions">
          <Link className="btn-cta btn-cta--md" href="/">
            <span>Back to the workshop page</span>
          </Link>
        </div>
      </StatusShell>
    );
  }

  const groupUrl = whatsappGroupUrl();

  return (
    <StatusShell>
      {isDesignPreview && <p className="preview-banner">DESIGN PREVIEW – not a real registration. No events fired.</p>}
      {verified && (
        <PurchaseTracker
          eventId={verified.purchaseEventId}
          value={verified.amountPaise / 100}
          currency={verified.currency}
        />
      )}
      <span className="status__icon status__icon--success">
        <Icon name="check" size={28} />
      </span>
      <h1 className="display status__title">You&apos;re registered!</h1>
      <p className="status__text">
        Your seat for <strong>{workshop.name}</strong> is confirmed. Join the WhatsApp group now – workshop updates and
        joining details are shared there.
      </p>
      <dl className="status__summary">
        <div>
          <dt>When</dt>
          <dd>
            {workshop.day}, {workshop.time}
          </dd>
        </div>
        <div>
          <dt>Format</dt>
          <dd>
            {workshop.format} · {workshop.durationMinutes} min
          </dd>
        </div>
      </dl>
      <div className="status__actions">
        {groupUrl && verified ? (
          <a className="btn-cta btn-cta--lg btn-whatsapp" href={groupUrl} rel="noopener noreferrer">
            <Icon name="message" size={20} />
            <span>JOIN THE WORKSHOP WHATSAPP GROUP</span>
          </a>
        ) : (
          <button className="btn-cta btn-cta--lg btn-whatsapp" type="button" disabled>
            <Icon name="message" size={20} />
            <span>JOIN THE WORKSHOP WHATSAPP GROUP</span>
          </button>
        )}
      </div>
      {!groupUrl && <p className="team-note">[TEAM: set WHATSAPP_GROUP_URL]</p>}
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
