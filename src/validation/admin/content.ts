import { z } from "zod";

import { ContentStatus, RoutineDifficulty, RoutineTimeOfDay } from "@/generated/prisma/enums";

import { claimFree, optionalId, optionalText, seoSchema, slugSchema } from "./common";

const title = z.string().trim().min(3, "Titlul are cel puțin 3 caractere.").max(120);
const minutes = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 600) {
      ctx.addIssue({ code: "custom", message: "Minute: un număr întreg între 1 și 600." });
      return z.NEVER;
    }
    return n;
  });

export const routineFormSchema = z.object({
  title,
  slug: slugSchema,
  summary: claimFree(z.string().trim().min(10, "Cel puțin 10 caractere.").max(300)),
  description: claimFree(optionalText(10_000)),
  timeOfDay: z.enum(RoutineTimeOfDay),
  difficulty: z.enum(RoutineDifficulty),
  durationMinutes: minutes,
  frequency: optionalText(80),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
  imageId: optionalId,
  needIds: z.array(z.uuid()).max(10).default([]),
  tagIds: z.array(z.uuid()).max(20).default([]),
  products: z
    .array(
      z.object({ id: z.uuid(), isOptional: z.boolean().default(false), note: optionalText(160) }),
    )
    .max(12)
    .default([])
    .refine((l) => new Set(l.map((p) => p.id)).size === l.length, "Un produs apare de două ori."),
  steps: z
    .array(
      z.object({
        title: z.string().trim().min(2, "Titlul pasului este obligatoriu.").max(80),
        instructions: claimFree(z.string().trim().min(5, "Descrie pasul.").max(2000)),
        durationMinutes: minutes,
        productId: optionalId,
      }),
    )
    .min(1, "Adaugă cel puțin un pas.")
    .max(20),
  seo: seoSchema.prefault({}),
});

export const articleFormSchema = z.object({
  title,
  slug: slugSchema,
  excerpt: claimFree(optionalText(300)),
  content: claimFree(
    z.string().trim().min(50, "Articolul are cel puțin 50 de caractere.").max(100_000),
  ),
  authorName: optionalText(80),
  categoryId: optionalId,
  status: z.enum(ContentStatus),
  publishedOn: z
    .union([z.iso.date("Dată invalidă."), z.literal("")])
    .optional()
    .transform((v) => v || null),
  featured: z.boolean().default(false),
  coverImageId: optionalId,
  productIds: z.array(z.uuid()).max(20).default([]),
  routineIds: z.array(z.uuid()).max(10).default([]),
  tagIds: z.array(z.uuid()).max(20).default([]),
  seo: seoSchema.prefault({}),
});

export type RoutineFormInput = z.input<typeof routineFormSchema>;
export type ArticleFormInput = z.input<typeof articleFormSchema>;
