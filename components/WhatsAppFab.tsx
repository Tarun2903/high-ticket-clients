import { WhatsAppLogo } from "./WhatsAppLogo";

const SUPPORT_NUMBER = "919620685025"; // +91 96206 85025
const MESSAGE = "Hi, I am interested in the High-Ticket Numerology Workshop. Please share more details.";
const HREF = `https://wa.me/${SUPPORT_NUMBER}?text=${encodeURIComponent(MESSAGE)}`;

/** Fixed bottom-right chat button. A plain link: opens WhatsApp Web/app in a new tab, the page stays put. */
export function WhatsAppFab() {
  return (
    <a
      className="wa-fab"
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <WhatsAppLogo size={30} />
    </a>
  );
}
