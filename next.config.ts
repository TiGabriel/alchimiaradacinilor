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

/**
 * Pages of the former shop (the site no longer sells; products are bought on doTERRA).
 * statusCode 301 rather than `permanent: true`, which would send 308.
 */
const shopRedirects: Array<{ source: string; destination: string }> = [
  { source: "/cos", destination: "/salvate" },
  { source: "/finalizare-comanda/:path*", destination: "/produse" },
  { source: "/cont/comenzi/:path*", destination: "/cont" },
  { source: "/cont/adrese", destination: "/cont/date-personale" },
  { source: "/livrare-si-retur", destination: "/cum-cumpar" },
  { source: "/politica-de-retur", destination: "/cum-cumpar" },
  { source: "/admin/comenzi/:path*", destination: "/admin" },
  { source: "/admin/cupoane/:path*", destination: "/admin" },
];

/** Sections renamed in the content restructure: Rutine → Ritualuri, Favorite → Salvate. */
const renamedSections: Array<{ source: string; destination: string }> = [
  { source: "/rutine", destination: "/ritualuri" },
  { source: "/rutine/:slug", destination: "/ritualuri/:slug" },
  { source: "/favorite", destination: "/salvate" },
  { source: "/cont/rutine", destination: "/cont/ritualuri" },
  { source: "/cont/favorite", destination: "/cont/salvate" },
  { source: "/admin/rutine/:path*", destination: "/admin/ritualuri/:path*" },
  { source: "/admin/clienti/:path*", destination: "/admin/membri/:path*" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [...shopRedirects, ...renamedSections].map((r) => ({ ...r, statusCode: 301 as const }));
  },
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
    // Review photos go through a Server Action (images are capped at 4 MB, src/validation/limits.ts).
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storageRemotePatterns(),
  },
};

export default nextConfig;
