import Link from "next/link";
import type { ReactNode } from "react";

/** Shell for policy pages. Razorpay activation requires Privacy, Terms, Refund and Contact pages. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="legal">
      <div className="container container--narrow">
        <Link href="/" className="legal__back">
          ← Back to the workshop
        </Link>
        <h1 className="display h2">{title}</h1>
        <div className="legal__body">{children}</div>
      </div>
    </main>
  );
}
