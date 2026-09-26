import type { NextConfig } from "next";

import { staticSecurityHeaders } from "./src/lib/security-headers";

/** Uploaded images served from an S3-compatible bucket/CDN (read at build time). */
function storageRemotePatterns(): NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> {
  const publicUrl = process.env.STORAGE_DRIVER === "s3" ? process.env.S3_PUBLIC_URL : undefined;
  if (!publicUrl) return [];
  const url = new URL(publicUrl);
  return [
    {
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      port: url.port,
      pathname: `${url.pathname.replace(/\/$/, "")}/**`,
    },
  ];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The CSP (with a per-request nonce) is set in src/proxy.ts.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: staticSecurityHeaders({
          https: (process.env.APP_URL ?? "").startsWith("https://"),
        }),
      },
    ];
  },
  experimental: {
    // Barrel packages not in Next's default list: import only what is used.
    optimizePackageImports: ["radix-ui"],
    // Review photos go through a Server Action (images are capped at 5 MB in validation).
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storageRemotePatterns(),
  },
};

export default nextConfig;
