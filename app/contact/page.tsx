import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { workshop } from "@/lib/workshop";

export const metadata: Metadata = { title: `Contact – ${workshop.name}` };

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>Questions about the workshop or your registration? Reach us here:</p>
      <p className="slot">[TEAM: BUSINESS NAME, SUPPORT EMAIL, PHONE / WHATSAPP, REGISTERED ADDRESS]</p>
    </LegalPage>
  );
}
