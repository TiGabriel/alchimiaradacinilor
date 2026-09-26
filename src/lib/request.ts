/** Request helpers — pure (no Next imports) and unit-tested. */

/** Client IP: first X-Forwarded-For hop (set by the platform's proxy), then X-Real-IP. */
export function clientIp(headers: Headers): string | null {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || null;
}

/**
 * True unless the browser says the request comes from another site. Browsers
 * send Origin on cross-origin POSTs; a missing header (same-origin beacons in
 * some browsers, server-to-server) is allowed.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return (
      new URL(origin).host === new URL(request.url).host ||
      new URL(origin).host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}
