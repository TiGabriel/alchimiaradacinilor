/** Base URL for canonical/OG links. Safe on server and client (NEXT_PUBLIC fallback). */
export function siteUrl(path = "/"): string {
  const base = (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_NAME = "Alchimia Rădăcinilor";
