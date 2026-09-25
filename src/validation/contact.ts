import { z } from "zod";

import { emailSchema } from "./auth";

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Scrie-ne numele tău.").max(80),
  email: emailSchema,
  subject: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v || null),
  message: z
    .string()
    .trim()
    .min(10, "Mesajul trebuie să aibă cel puțin 10 caractere.")
    .max(4000, "Mesajul este prea lung."),
  /** Honeypot: humans never see or fill this field. */
  website: z.string().max(0).optional().or(z.literal("")),
});
