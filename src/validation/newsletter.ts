import { z } from "zod";

import { hasUnsubscribeTag } from "@/lib/email/brevo-html";

export const subscribeSchema = z.object({
  email: z.email("Introdu o adresă de email validă.").trim().toLowerCase().max(254),
  source: z.enum(["footer", "homepage", "cont"]).default("footer"),
});

/** Campaigns saved before the shop closed used `customersOnly`; it now means `membersOnly`. */
function migrateLegacySegment(value: unknown) {
  if (value && typeof value === "object" && "customersOnly" in value) {
    const { customersOnly, ...rest } = value as Record<string, unknown>;
    return "membersOnly" in rest ? rest : { ...rest, membersOnly: customersOnly };
  }
  return value;
}

/** Campaign audience. Empty = every active subscriber. */
export const campaignSegmentSchema = z.preprocess(
  migrateLegacySegment,
  z.object({
    /** Subscribers who picked at least one of these interests (need/aroma slugs). */
    interests: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .max(20)
      .optional(),
    /** Where they subscribed (footer, homepage, cont, registration…). */
    sources: z.array(z.string().max(40)).max(10).optional(),
    /** Only subscribers who also have an account on the site. */
    membersOnly: z.boolean().optional(),
    /** Only subscribers confirmed on or after this date (ISO). */
    confirmedSince: z.iso.date().optional(),
  }),
);

export type CampaignSegment = z.infer<typeof campaignSegmentSchema>;

/** Brevo accepts campaign HTML under 1 MB. */
export const CAMPAIGN_HTML_MAX = 900_000;

export const campaignSchema = z
  .object({
    subject: z.string().trim().min(3).max(120),
    preheader: z.string().trim().max(160).optional(),
    heading: z.string().trim().min(3).max(120),
    /** Plain paragraphs separated by blank lines. Optional when the campaign has designed HTML. */
    body: z.string().trim().max(10_000).default(""),
    /** Designed HTML for Brevo, with Brevo's tags kept. Empty = plain campaign only. */
    html: z
      .string()
      .trim()
      .max(CAMPAIGN_HTML_MAX, "HTML-ul trebuie să aibă sub 900 KB.")
      .optional()
      .transform((v) => v || null)
      .refine((v) => v === null || hasUnsubscribeTag(v), {
        message: "HTML-ul trebuie să conțină linkul de dezabonare Brevo: {{ unsubscribe }}.",
      }),
    segment: campaignSegmentSchema.default({}),
  })
  .superRefine((value, ctx) => {
    if (!value.html && value.body.length < 20)
      ctx.addIssue({
        code: "custom",
        path: ["body"],
        message: "Scrie textul campaniei (minimum 20 de caractere) sau adaugă HTML-ul cu design.",
      });
  });
