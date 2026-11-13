import { FloatingCta } from "@/components/registration/FloatingCta";
import { RegistrationProvider } from "@/components/registration/RegistrationProvider";
import { Faq, FinalCta, Footer, WorkshopDetails } from "@/components/sections/Close";
import { Hero, TopBar } from "@/components/sections/Hero";
import { Results } from "@/components/sections/Results";
import { VideoTestimonials } from "@/components/sections/VideoTestimonials";
import { Audience, Host } from "@/components/sections/Proof";
import { BigPicture, Modules, Problem, Shift } from "@/components/sections/Story";
import { WhatsAppFab } from "@/components/WhatsAppFab";
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
        <Results />
        <VideoTestimonials />
        <Host />
        <Audience />
        <WorkshopDetails />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <FloatingCta />
      <WhatsAppFab />
    </RegistrationProvider>
  );
}
