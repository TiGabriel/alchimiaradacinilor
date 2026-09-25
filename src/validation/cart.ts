import { z } from "zod";

import { MAX_QUANTITY_PER_LINE } from "@/services/cart/calculate";

export const productIdSchema = z.uuid();

export const addToCartSchema = z.object({
  productId: productIdSchema,
  quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_LINE).default(1),
});

export const setQuantitySchema = z.object({
  productId: productIdSchema,
  quantity: z.number().int().min(0).max(MAX_QUANTITY_PER_LINE),
});

export const productIdsSchema = z.array(productIdSchema).max(100);
