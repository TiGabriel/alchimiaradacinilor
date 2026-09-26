/**
 * Security headers. Pure (no Next or env imports) so the proxy, next.config and
 * tests share one definition.
 */

export type CspOptions = {
  /** Fresh per request; Next.js adds it to its own scripts. */
  nonce: string;
  /** Development needs `unsafe-eval` (React's debugging stacks). */
  dev: boolean;
  /** Extra image origins, e.g. the S3/CDN public URL. */
  imageOrigins?: string[];
  /** Only over HTTPS: on http://localhost it would break every subresource. */
  upgradeInsecureRequests?: boolean;
};

/** Origin of a URL, or null when it is not a valid absolute URL. */
export function originOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Nonce-based policy: scripts run only when Next.js marked them with the
 * nonce ('strict-dynamic' lets those load their own chunks). Styles allow
 * inline because React style props and Radix/Motion write style attributes.
 */
export function buildCsp({ nonce, dev, imageOrigins = [], upgradeInsecureRequests }: CspOptions) {
  const directives: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    [
      "script-src",
      ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'", ...(dev ? ["'unsafe-eval'"] : [])],
    ],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", ["'self'", "blob:", "data:", ...imageOrigins]],
    ["font-src", ["'self'"]],
    ["connect-src", ["'self'", ...(dev ? ["ws:"] : [])]],
    ["media-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["frame-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
    ["manifest-src", ["'self'"]],
  ];
  const policy = directives.map(([name, values]) => `${name} ${values.join(" ")}`);
  if (upgradeInsecureRequests) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

/** A random nonce (base64 of 16 random bytes). */
export function createNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes));
}

/** Headers for every response (set in next.config). */
export function staticSecurityHeaders(opts: { https: boolean }) {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), browsing-topics=(), interest-cohort=()",
    },
    ...(opts.https
      ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
      : []),
  ];
}
