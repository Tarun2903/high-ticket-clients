// Payment-failure page (Razorpay payment.failed / user cancelled). Offers a retry through
// the same registration action as every other CTA.
import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { RegisterButton } from "@/components/registration/RegisterButton";
import { RegistrationProvider } from "@/components/registration/RegistrationProvider";

export const metadata: Metadata = { title: "Payment not completed", robots: { index: false, follow: false } };

export default function PaymentFailedPage() {
  return (
    <RegistrationProvider>
      <main className="status">
        <div className="status__card">
          <span className="status__icon status__icon--error">
            <Icon name="alert" size={28} />
          </span>
          <h1 className="display status__title">Your payment wasn&apos;t completed</h1>
          <p className="status__text">
            Your seat hasn&apos;t been confirmed. You can try again below. If money was debited but this page still
            appears, please <Link href="/contact">contact us</Link> with your payment details.
          </p>
          <div className="status__actions">
            <RegisterButton size="lg" />
          </div>
        </div>
      </main>
    </RegistrationProvider>
  );
}
