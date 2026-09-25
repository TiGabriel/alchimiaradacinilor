import { z } from "zod";

import { claimFree, optionalId, optionalText, slugSchema } from "./common";

const name = z.string().trim().min(2, "Numele are cel puțin 2 caractere.").max(80);
const position = z.coerce.number().int().min(0).max(9999).default(0);
const description = claimFree(optionalText(2000));

export const TAXONOMY_KINDS = [
  "categorii",
  "marci",
  "colectii",
  "etichete",
  "nevoi",
  "arome",
] as const;
export type TaxonomyKind = (typeof TAXONOMY_KINDS)[number];

export const taxonomySchemas = {
  categorii: z.object({
    name,
    slug: slugSchema,
    description,
    parentId: optionalId,
    position,
    active: z.boolean().default(true),
  }),
  marci: z.object({
    name,
    slug: slugSchema,
    description,
    website: z
      .union([z.url("Adresă web invalidă (https://…)."), z.literal("")])
      .optional()
      .transform((v) => v || null),
    active: z.boolean().default(true),
  }),
  colectii: z.object({
    name,
    slug: slugSchema,
    description,
    position,
    active: z.boolean().default(true),
  }),
  etichete: z.object({ name, slug: slugSchema }),
  nevoi: z.object({ name, slug: slugSchema, description, position }),
  arome: z.object({
    name,
    slug: slugSchema,
    description,
    position,
    colorHex: z
      .union([z.string().regex(/^#[0-9a-fA-F]{6}$/, "Culoare în format #a1b2c3."), z.literal("")])
      .optional()
      .transform((v) => v || null),
  }),
} satisfies Record<TaxonomyKind, z.ZodType>;

export function isTaxonomyKind(value: string): value is TaxonomyKind {
  return (TAXONOMY_KINDS as readonly string[]).includes(value);
}

/** A category cannot become its own ancestor. Pure; `parents` maps id → parentId. */
export function createsCycle(
  id: string,
  newParentId: string | null,
  parents: Map<string, string | null>,
): boolean {
  let current = newParentId;
  const seen = new Set<string>();
  while (current) {
    if (current === id || seen.has(current)) return true;
    seen.add(current);
    current = parents.get(current) ?? null;
  }
  return false;
}
