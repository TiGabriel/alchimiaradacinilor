import { z } from "zod";

import { ProductType } from "@/generated/prisma/enums";

/**
 * Type-specific product attributes stored in Product.attributes (JSON).
 * Anything that becomes filterable should be promoted to a real column.
 */
export const productAttributeSchemas = {
  [ProductType.INDIVIDUAL_OIL]: z.object({
    volumeMl: z.number().positive().optional(),
    botanicalName: z.string().optional(),
    plantPart: z.string().optional(),
    extractionMethod: z.string().optional(),
  }),
  [ProductType.BLEND]: z.object({
    volumeMl: z.number().positive().optional(),
  }),
  [ProductType.KIT]: z.object({}),
  [ProductType.DIFFUSER]: z.object({
    tankCapacityMl: z.number().positive().optional(),
    runtimeHours: z.number().positive().optional(),
    material: z.string().optional(),
  }),
  [ProductType.ACCESSORY]: z.object({
    material: z.string().optional(),
  }),
  [ProductType.OTHER]: z.object({}),
} satisfies Record<ProductType, z.ZodType>;

export function parseProductAttributes(type: ProductType, value: unknown) {
  return productAttributeSchemas[type].parse(value ?? {});
}

export const productTypeLabels: Record<ProductType, string> = {
  INDIVIDUAL_OIL: "Ulei individual",
  BLEND: "Amestec",
  KIT: "Kit",
  DIFFUSER: "Difuzor",
  ACCESSORY: "Accesoriu",
  OTHER: "Altele",
};
