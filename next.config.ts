import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Host photo / case-study images are served as AVIF or WebP automatically.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
