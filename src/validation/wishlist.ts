import { z } from "zod";

export const productIdSchema = z.uuid();

export const productIdsSchema = z.array(productIdSchema).max(100);
