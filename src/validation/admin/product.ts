import { z } from "zod";

import { ProductType } from "@/generated/prisma/enums";

import { productAttributeSchemas } from "../product";

import {
  claimFree,
  moneySchema,
  optionalId,
  optionalMoneySchema,
  optionalText,
  seoSchema,
  slugSchema,
} from "./common";

const numberField = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") return undefined;
    const n = typeof v === "number" ? v : Number(v.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({ code: "custom", message: "Introdu un număr pozitiv." });
      return z.NEVER;
    }
    return n;
  });

/** Raw attribute inputs; validated against the product type's schema below. */
const attributesInput = z
  .object({
    volumeMl: numberField,
    tankCapacityMl: numberField,
    runtimeHours: numberField,
    botanicalName: optionalText(120),
    plantPart: optionalText(80),
    extractionMethod: optionalText(80),
    material: optionalText(80),
  })
  .partial()
  .default({});

export const productFormSchema = z
  .object({
    name: z.string().trim().min(2, "Numele are cel puțin 2 caractere.").max(120),
    slug: slugSchema,
    sku: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9][A-Z0-9-]{1,39}$/, "SKU: litere mari, cifre și cratime (2–40)."),
    brandId: optionalId,
    categoryId: z.uuid("Alege o categorie."),
    productType: z.enum(ProductType, { message: "Alege tipul produsului." }),
    shortDescription: claimFree(
      z.string().trim().min(10, "Cel puțin 10 caractere.").max(300, "Cel mult 300 de caractere."),
    ),
    description: claimFree(z.string().trim().min(20, "Cel puțin 20 de caractere.").max(20_000)),
    usageInfo: claimFree(optionalText(5000)),
    safetyInfo: optionalText(5000),
    price: moneySchema.refine((v) => v > 0, "Prețul trebuie să fie mai mare decât 0."),
    compareAtPrice: optionalMoneySchema,
    stock: z.coerce.number().int("Stocul este un număr întreg.").min(0).max(1_000_000),
    featured: z.boolean().default(false),
    active: z.boolean().default(true),
    needs: z
      .array(z.object({ id: z.uuid(), relevance: z.number().int().min(1).max(3) }))
      .max(20)
      .default([]),
    aromas: z
      .array(z.object({ id: z.uuid(), intensity: z.number().int().min(1).max(5) }))
      .max(20)
      .default([]),
    tagIds: z.array(z.uuid()).max(30).default([]),
    collectionIds: z.array(z.uuid()).max(20).default([]),
    attributes: attributesInput,
    seo: seoSchema.prefault({}),
  })
  .superRefine((value, ctx) => {
    if (value.compareAtPrice != null && value.compareAtPrice <= value.price)
      ctx.addIssue({
        code: "custom",
        path: ["compareAtPrice"],
        message: "Prețul vechi trebuie să fie mai mare decât prețul actual.",
      });
    const attrs = productAttributeSchemas[value.productType].safeParse(
      Object.fromEntries(Object.entries(value.attributes).filter(([, v]) => v != null)),
    );
    if (!attrs.success)
      ctx.addIssue({ code: "custom", path: ["attributes"], message: "Atribute invalide." });
    if (new Set(value.needs.map((n) => n.id)).size !== value.needs.length)
      ctx.addIssue({ code: "custom", path: ["needs"], message: "O nevoie apare de două ori." });
    if (new Set(value.aromas.map((a) => a.id)).size !== value.aromas.length)
      ctx.addIssue({ code: "custom", path: ["aromas"], message: "Un profil apare de două ori." });
  })
  .transform((value) => ({
    ...value,
    // Keep only the attributes that belong to this product type.
    attributes: productAttributeSchemas[value.productType].parse(
      Object.fromEntries(Object.entries(value.attributes).filter(([, v]) => v != null)),
    ) as Record<string, unknown>,
  }));

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const imageAltSchema = z.string().trim().max(160, "Cel mult 160 de caractere.");
