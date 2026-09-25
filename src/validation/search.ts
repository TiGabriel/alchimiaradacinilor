import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().max(100).catch(""),
  limit: z.coerce.number().int().min(1).max(24).catch(6),
});
