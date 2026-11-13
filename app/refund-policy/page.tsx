import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { workshop } from "@/lib/workshop";

export const metadata: Metadata = { title: `Refund & Cancellation Policy – ${workshop.name}` };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy">
      <p className="team-note team-note--block">
        [TEAM: STATE YOUR REFUND & CANCELLATION POLICY FOR THE WORKSHOP REGISTRATION FEE. Razorpay requires this page
        before activating payments.]
      </p>
      <p className="slot">[TEAM: REFUND ELIGIBILITY, TIMELINES, WHAT HAPPENS IF THE SESSION IS RESCHEDULED]</p>
    </LegalPage>
  );
}
