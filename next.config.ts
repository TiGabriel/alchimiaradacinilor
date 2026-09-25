import type { NextConfig } from "next";

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
  experimental: {
    // Review photos go through a Server Action (images are capped at 5 MB in validation).
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: storageRemotePatterns(),
  },
};

export default nextConfig;
