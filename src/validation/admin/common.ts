import { z } from "zod";

import { findMedicalClaims, MEDICAL_CLAIMS_MESSAGE } from "@/lib/claims";
import { toMinor } from "@/lib/money";

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, "Slug-ul are cel puțin 2 caractere.")
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Doar litere mici fără diacritice, cifre și cratime.");

/** Empty string → null (optional text fields from forms). */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Cel mult ${max} de caractere.`)
    .transform((v) => v || null)
    .nullable()
    .optional();

export const optionalId = z
  .union([z.uuid(), z.literal(""), z.null()])
  .optional()
  .transform((v) => v || null);

/** Lei as typed by a person ("59,90", "59.9", "59") → bani. */
export const moneySchema = z
  .string()
  .trim()
  .regex(/^\d{1,7}([.,]\d{1,2})?$/, "Introdu un preț valid, de ex. 59,90.")
  .transform((v) => toMinor(v));

export const optionalMoneySchema = z
  .union([moneySchema, z.literal("")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

/** Customer-facing copy must not make medical or therapeutic claims. */
export const claimFree = <T extends z.ZodType<string | null | undefined>>(schema: T) =>
  schema.refine((v) => findMedicalClaims(v ?? "").length === 0, MEDICAL_CLAIMS_MESSAGE);

/** A site path ("/produs/lavanda") or an absolute http(s) URL; empty → null (use the page's own URL). */
export const canonicalSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(
        /^\/[a-z0-9\-/]*$/,
        "O cale de pe site (de ex. /produs/lavanda) sau o adresă https://…",
      ),
    z.url({
      protocol: /^https?$/,
      error: "O cale de pe site (de ex. /produs/lavanda) sau o adresă https://…",
    }),
  ])
  .optional()
  .nullable()
  .transform((v) => v || null);

/** SEO fields shared by products, categories, routines and articles (stored in SeoMeta). */
export const seoFields = {
  seoTitle: optionalText(70),
  metaDescription: optionalText(160),
  canonicalUrl: canonicalSchema,
  /** Social preview image (MediaAsset id); empty → the page's own image, then the site default. */
  ogImageId: optionalId,
  noIndex: z.boolean().default(false),
};

export const seoSchema = z.object(seoFields);
export type SeoInput = z.output<typeof seoSchema>;
