import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    // Remote hosts (S3/R2/CDN) are added here when the storage driver is configured.
    remotePatterns: [],
  },
};

export default nextConfig;
