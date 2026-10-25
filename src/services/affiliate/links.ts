/** doTERRA outbound links — pure and unit-tested (no I/O; client components import it). */

/** Pages a "Cumpără de pe doTERRA" button can sit on (`?sursa=` of the counter route). */
export const OUTBOUND_SOURCES = [
  "produs",
  "acasa",
  "previzualizare",
  "quiz",
  "ritual",
  "favorite",
  "jurnal",
  "newsletter",
] as const;
export type OutboundSource = (typeof OUTBOUND_SOURCES)[number];

/** Clicks with a missing or unknown `sursa` are still counted, under this name. */
export const UNKNOWN_SOURCE = "altul";

export function parseOutboundSource(raw: string | null | undefined): OutboundSource | "altul" {
  return (OUTBOUND_SOURCES as readonly string[]).includes(raw ?? "")
    ? (raw as OutboundSource)
    : UNKNOWN_SOURCE;
}

/** Our counter route; it records the click and redirects to the product's referral link. */
export function outboundHref(product: { slug: string }, source: OutboundSource): string {
  return `/spre-doterra/${encodeURIComponent(product.slug)}?sursa=${source}`;
}

/**
 * Whether a pasted referral link may be used: https, no credentials, and a host that is one of
 * `allowedHosts` or a subdomain of one (www.doterra.com for doterra.com, never doterra.com.evil.ro).
 */
export function isAllowedReferralUrl(raw: string, allowedHosts: readonly string[]): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port) return false;
  const host = url.hostname.toLowerCase();
  return allowedHosts.some((allowed) => {
    const a = allowed.toLowerCase();
    return host === a || host.endsWith(`.${a}`);
  });
}

/** Crawlers, link previews and monitors: redirected, but not counted as visitors. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|discord|skype|monitor|curl|wget|python|node-fetch|axios|headless|lighthouse/i;

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  return !userAgent || BOT_PATTERN.test(userAgent);
}
