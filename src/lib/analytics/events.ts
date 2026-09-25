/** Analytics event catalogue — pure (no browser or server APIs) and unit-tested. */
import { z } from "zod";

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

/** Flat, small, non-personal properties only (ids, slugs, counts, amounts). */
const propValue = z.union([z.string().max(120), z.number().finite(), z.boolean(), z.null()]);
export const eventPropsSchema = z
  .record(z.string().regex(/^[a-z][a-zA-Z0-9_]{0,39}$/), propValue)
  .refine((p) => Object.keys(p).length <= 12, "Too many properties");

export type EventProps = Record<string, string | number | boolean | null>;

export const analyticsPayloadSchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  anonymousId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  path: z.string().max(300).startsWith("/").optional(),
  props: eventPropsSchema.default({}),
});

export type AnalyticsPayload = z.infer<typeof analyticsPayloadSchema>;

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
