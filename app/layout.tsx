import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { meta } from "@/lib/content";
import { META_PIXEL_ID } from "@/lib/meta";
import { workshop } from "@/lib/workshop";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["opsz"],
});
const body = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
// Strict formats so nothing unexpected can be injected into the inline tag scripts.
const pixelId = META_PIXEL_ID || undefined;
const gtmRaw = process.env.NEXT_PUBLIC_GTM_ID || "";
const gtmId = /^GTM-[A-Z0-9]+$/.test(gtmRaw) ? gtmRaw : undefined;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: meta.title,
  description: meta.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: meta.title,
    description: meta.description,
    url: "/",
    siteName: workshop.name,
    type: "website",
    locale: "en_IN",
  },
  twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f1115",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${display.variable} ${body.variable}`}>
      <body>
        {pixelId && (
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        )}
        {children}
        <Analytics pixelId={pixelId} gtmId={gtmId} />
      </body>
    </html>
  );
}
