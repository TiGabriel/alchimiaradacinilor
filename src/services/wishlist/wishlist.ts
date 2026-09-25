import "server-only";

import { db } from "@/lib/db";

import { mergeWishlistIds } from "./merge";

/** Product ids in the user's saved wishlist, newest first. */
export async function getUserWishlistIds(userId: string): Promise<string[]> {
  const wishlist = await db.wishlist.findUnique({
    where: { userId },
    select: { items: { orderBy: { createdAt: "desc" }, select: { productId: true } } },
  });
  return wishlist?.items.map((i) => i.productId) ?? [];
}

/**
 * Merges the browser's wishlist into the account after login (auth phase).
 * Unknown/inactive products are ignored. Returns the merged ids.
 */
export async function mergeLocalWishlistIntoUser(
  userId: string,
  localIds: string[],
): Promise<string[]> {
  const valid = await db.product.findMany({
    where: { id: { in: localIds }, active: true },
    select: { id: true },
  });
  const validIds = new Set(valid.map((p) => p.id));
  const accountIds = await getUserWishlistIds(userId);
  const merged = mergeWishlistIds(
    accountIds,
    localIds.filter((id) => validIds.has(id)),
  );
  const toAdd = merged.filter((id) => !accountIds.includes(id));

  const wishlist = await db.wishlist.upsert({ where: { userId }, create: { userId }, update: {} });
  if (toAdd.length) {
    await db.wishlistItem.createMany({
      data: toAdd.map((productId) => ({ wishlistId: wishlist.id, productId })),
      skipDuplicates: true,
    });
  }
  return merged;
}

/** Adds or removes one product; returns the updated ids. */
export async function toggleUserWishlist(userId: string, productId: string): Promise<string[]> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { active: true },
  });
  const wishlist = await db.wishlist.upsert({ where: { userId }, create: { userId }, update: {} });
  const existing = await db.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
  });
  if (existing) {
    await db.wishlistItem.delete({
      where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    });
  } else if (product?.active) {
    await db.wishlistItem.create({ data: { wishlistId: wishlist.id, productId } });
  }
  return getUserWishlistIds(userId);
}
