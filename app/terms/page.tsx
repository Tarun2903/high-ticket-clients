import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { workshop } from "@/lib/workshop";

export const metadata: Metadata = { title: `Terms & Conditions – ${workshop.name}` };

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions">
      <p className="team-note team-note--block">
        [TEAM: REPLACE WITH YOUR LEGALLY REVIEWED TERMS & CONDITIONS BEFORE RUNNING ADS.]
      </p>
      <p>
        {workshop.name} is a live online business workshop for people already practising numerology. It does not teach
        numerology.
      </p>
      <p>
        No specific client or revenue result is guaranteed. The workshop teaches strategies and frameworks that you can
        implement in your business.
      </p>
      <p className="slot">[TEAM: BUSINESS LEGAL NAME, GOVERNING LAW, ACCESS RULES, RECORDING POLICY]</p>
    </LegalPage>
  );
}
