import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Host photo / case-study images are served as AVIF or WebP automatically.
    formats: ["image/avif", "image/webp"],
    // The results screenshots are requested as "/images/testimonials/x.png?v=<imageVersion>" (see lib/results.ts), so a
    // replaced picture gets a new address and can never be served from a stale browser/CDN/optimizer cache.
    localPatterns: [{ pathname: "/images/**" }],
  },
};

export default nextConfig;
