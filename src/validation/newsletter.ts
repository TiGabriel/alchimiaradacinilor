import { z } from "zod";

export const subscribeSchema = z.object({
  email: z.email("Introdu o adresă de email validă.").trim().toLowerCase().max(254),
  source: z.enum(["footer", "homepage", "cont", "checkout"]).default("footer"),
});

/** Campaign audience. Empty = every active subscriber. */
export const campaignSegmentSchema = z.object({
  /** Subscribers who picked at least one of these interests (need/aroma slugs). */
  interests: z
    .array(z.string().regex(/^[a-z0-9-]+$/))
    .max(20)
    .optional(),
  /** Where they subscribed (footer, homepage, cont, checkout, registration…). */
  sources: z.array(z.string().max(40)).max(10).optional(),
  /** Only subscribers who have an account with at least one order. */
  customersOnly: z.boolean().optional(),
  /** Only subscribers confirmed on or after this date (ISO). */
  confirmedSince: z.iso.date().optional(),
});

export type CampaignSegment = z.infer<typeof campaignSegmentSchema>;

export const campaignSchema = z.object({
  subject: z.string().trim().min(3).max(120),
  preheader: z.string().trim().max(160).optional(),
  heading: z.string().trim().min(3).max(120),
  /** Plain paragraphs separated by blank lines. */
  body: z.string().trim().min(20).max(10_000),
  segment: campaignSegmentSchema.default({}),
});
