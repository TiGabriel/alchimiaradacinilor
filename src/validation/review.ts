import { z } from "zod";

import { REVIEW_IMAGE_MAX_BYTES } from "./limits";

export { REVIEW_IMAGE_MAX_BYTES };

export const reviewSchema = z.object({
  productId: z.uuid(),
  rating: z.coerce
    .number({ message: "Alege o notă de la 1 la 5 stele." })
    .int()
    .min(1, "Alege o notă de la 1 la 5 stele.")
    .max(5, "Alege o notă de la 1 la 5 stele."),
  title: z
    .string()
    .trim()
    .max(80, "Titlul poate avea cel mult 80 de caractere.")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  body: z
    .string()
    .trim()
    .min(20, "Spune-ne puțin mai mult — cel puțin 20 de caractere.")
    .max(2000, "Recenzia poate avea cel mult 2000 de caractere."),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export const moderationSchema = z.object({
  reviewId: z.uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reason: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null)
    .nullable()
    .optional(),
});
