import { FloatingCta } from "@/components/registration/FloatingCta";
import { RegistrationProvider } from "@/components/registration/RegistrationProvider";
import { Faq, FinalCta, Footer, WorkshopDetails } from "@/components/sections/Close";
import { Hero, TopBar } from "@/components/sections/Hero";
import { Audience, CaseStudies, Host } from "@/components/sections/Proof";
import { BigPicture, Modules, Problem, Shift } from "@/components/sections/Story";
import { PageTracking } from "@/components/tracking/PageTracking";

export default function WorkshopLandingPage() {
  return (
    <RegistrationProvider>
      <PageTracking />
      <TopBar />
      <main>
        <Hero />
        <Problem />
        <Shift />
        <Modules />
        <BigPicture />
        <CaseStudies />
        <Host />
        <Audience />
        <WorkshopDetails />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <FloatingCta />
    </RegistrationProvider>
  );
}
