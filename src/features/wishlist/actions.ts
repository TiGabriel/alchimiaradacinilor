"use server";

import { getProductCards } from "@/services/catalog/products";
import type { ProductCardData } from "@/services/catalog/product-types";
import {
  getUserWishlistIds,
  mergeLocalWishlistIntoUser,
  toggleUserWishlist,
} from "@/services/wishlist/wishlist";
import { productIdSchema, productIdsSchema } from "@/validation/cart";

import { getCurrentUser } from "../auth/session";

/** Cards for the given ids (inactive/unknown ids are dropped). */
export async function getWishlistProductsAction(ids: string[]): Promise<ProductCardData[]> {
  const parsed = productIdsSchema.safeParse(ids.filter((id) => typeof id === "string"));
  if (!parsed.success) return [];
  return getProductCards(parsed.data);
}

export async function getAccountWishlistAction(): Promise<string[] | null> {
  const user = await getCurrentUser();
  return user ? getUserWishlistIds(user.id) : null;
}

export async function toggleAccountWishlistAction(productId: string): Promise<string[] | null> {
  const user = await getCurrentUser();
  const parsed = productIdSchema.safeParse(productId);
  if (!user || !parsed.success) return null;
  return toggleUserWishlist(user.id, parsed.data);
}

/** Called once after sign-in with the browser's guest wishlist. */
export async function mergeWishlistAction(localIds: string[]): Promise<string[] | null> {
  const user = await getCurrentUser();
  const parsed = productIdsSchema.safeParse(localIds.filter((id) => typeof id === "string"));
  if (!user) return null;
  return mergeLocalWishlistIntoUser(user.id, parsed.success ? parsed.data : []);
}
