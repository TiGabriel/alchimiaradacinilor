import { z } from "zod";

import { ProductType, QuizQuestionType } from "@/generated/prisma/enums";

import { optionalMoneySchema, optionalText } from "./common";

const weight = z.coerce
  .number()
  .int("Greutatea este un număr întreg.")
  .min(-10, "Între -10 și 10.")
  .max(10, "Între -10 și 10.")
  .refine((n) => n !== 0, "0 nu are efect — elimină legătura.");

const position = z.coerce.number().int().min(0).max(999).default(0);

export const quizQuestionSchema = z.object({
  text: z.string().trim().min(3, "Întrebarea are cel puțin 3 caractere.").max(200),
  helpText: optionalText(300),
  type: z.enum(QuizQuestionType),
  required: z.boolean().default(true),
  position,
});

const unique = <T extends { id: string }>(list: T[]) =>
  new Set(list.map((x) => x.id)).size === list.length;

export const quizAnswerSchema = z.object({
  text: z.string().trim().min(1, "Scrie răspunsul.").max(120),
  position,
  /** Budget ceiling in lei (products above it get the budget penalty). */
  maxPrice: optionalMoneySchema,
  needs: z
    .array(z.object({ id: z.uuid(), weight }))
    .max(10)
    .default([])
    .refine(unique, "O nevoie apare de două ori."),
  aromas: z
    .array(z.object({ id: z.uuid(), weight }))
    .max(10)
    .default([])
    .refine(unique, "Un profil apare de două ori."),
  tags: z
    .array(z.object({ id: z.uuid(), weight }))
    .max(10)
    .default([])
    .refine(unique, "O etichetă apare de două ori."),
  productTypes: z
    .array(z.object({ type: z.enum(ProductType), weight }))
    .max(6)
    .default([])
    .refine((l) => new Set(l.map((x) => x.type)).size === l.length, "Un tip apare de două ori."),
});

export type QuizAnswerInput = z.input<typeof quizAnswerSchema>;
