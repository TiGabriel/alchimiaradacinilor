/** Server-side validation of analytics beacons (kept out of the client bundle). */
import { z } from "zod";

import { ANALYTICS_EVENTS, type AnalyticsPayload } from "./events";

/** Flat, small, non-personal properties only (ids, slugs, counts, amounts). */
const propValue = z.union([z.string().max(120), z.number().finite(), z.boolean(), z.null()]);
export const eventPropsSchema = z
  .record(z.string().regex(/^[a-z][a-zA-Z0-9_]{0,39}$/), propValue)
  .refine((p) => Object.keys(p).length <= 12, "Too many properties");

export const analyticsPayloadSchema = z.object({
  name: z.enum(ANALYTICS_EVENTS),
  anonymousId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
  path: z.string().max(300).startsWith("/").optional(),
  props: eventPropsSchema.default({}),
}) satisfies z.ZodType<AnalyticsPayload, unknown>;
