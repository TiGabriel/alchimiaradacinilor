/** Signed, stateless unsubscribe links — pure and unit-tested. */
import { createHmac, timingSafeEqual } from "node:crypto";

export function unsubscribeSignature(subscriberId: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`newsletter-unsubscribe:${subscriberId}`)
    .digest("base64url");
}

export function verifyUnsubscribeSignature(
  subscriberId: string,
  signature: string,
  secret: string,
): boolean {
  const expected = Buffer.from(unsubscribeSignature(subscriberId, secret));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function unsubscribeUrl(baseUrl: string, subscriberId: string, secret: string): string {
  const url = new URL("/newsletter/dezabonare", baseUrl);
  url.searchParams.set("s", subscriberId);
  url.searchParams.set("t", unsubscribeSignature(subscriberId, secret));
  return url.toString();
}

/** One-click unsubscribe endpoint (RFC 8058), referenced by the List-Unsubscribe header. */
export function oneClickUnsubscribeUrl(baseUrl: string, subscriberId: string, secret: string) {
  const url = new URL("/api/newsletter/dezabonare", baseUrl);
  url.searchParams.set("s", subscriberId);
  url.searchParams.set("t", unsubscribeSignature(subscriberId, secret));
  return url.toString();
}
