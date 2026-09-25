"use server";

import { getProductCards } from "@/services/catalog/products";
import type { ProductCardData } from "@/services/catalog/product-types";
import { productIdsSchema } from "@/validation/cart";

/** Cards for the ids stored in the browser (inactive/unknown ids are dropped). */
export async function getWishlistProductsAction(ids: string[]): Promise<ProductCardData[]> {
  const parsed = productIdsSchema.safeParse(ids.filter((id) => typeof id === "string"));
  if (!parsed.success) return [];
  return getProductCards(parsed.data);
}
