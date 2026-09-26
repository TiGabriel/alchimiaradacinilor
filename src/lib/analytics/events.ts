/**
 * Analytics event catalogue — pure (no browser or server APIs) and unit-tested.
 * No Zod here: this module ships to the browser (the schema is in `./schema`).
 */

export const ANALYTICS_EVENTS = [
  "product_view",
  "search",
  "quiz_started",
  "quiz_completed",
  "add_to_cart",
  "wishlist_add",
  "checkout_started",
  "order_completed",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export type EventProps = Record<string, string | number | boolean | null>;

export type AnalyticsPayload = {
  name: AnalyticsEventName;
  anonymousId: string;
  path?: string;
  props: EventProps;
};

/** Keys that could carry personal data are never sent, whatever the caller passes. */
const FORBIDDEN_KEYS = /email|phone|name|address|telefon|adresa/i;

export function sanitizeProps(props: Record<string, unknown> = {}): EventProps {
  const out: EventProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (FORBIDDEN_KEYS.test(key)) continue;
    if (typeof value === "string") out[key] = value.slice(0, 120);
    else if (typeof value === "number" && Number.isFinite(value)) out[key] = value;
    else if (typeof value === "boolean" || value === null) out[key] = value;
  }
  return out;
}

/** Path without query string (search terms and tokens stay out of the path). */
export function cleanPath(pathname: string): string {
  return pathname.split(/[?#]/)[0]!.slice(0, 300) || "/";
}
