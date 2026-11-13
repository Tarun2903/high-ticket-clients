import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { workshop } from "@/lib/workshop";

export const metadata: Metadata = { title: `Privacy Policy – ${workshop.name}` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p className="team-note team-note--block">
        [TEAM: REPLACE WITH YOUR LEGALLY REVIEWED PRIVACY POLICY BEFORE RUNNING ADS.]
      </p>
      <p>
        When you register for {workshop.name} we collect your name, email address and WhatsApp number to process your
        registration, share workshop updates and send joining details.
      </p>
      <p>
        Payments are processed by our payment partner. We do not store your card or bank details.
      </p>
      <p>
        We use the Meta Pixel and Meta Conversions API to measure the performance of our advertising. These tools may
        process technical information such as your IP address, browser details and cookies, and – only for completed
        registrations – a hashed (encrypted) version of your email and phone number.
      </p>
      <p>We do not sell your personal information.</p>
      <p className="slot">[TEAM: BUSINESS NAME, CONTACT EMAIL FOR DATA REQUESTS, DATA RETENTION PERIOD]</p>
    </LegalPage>
  );
}
