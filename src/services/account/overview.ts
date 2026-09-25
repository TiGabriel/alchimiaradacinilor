import "server-only";

import { db } from "@/lib/db";
import { getNewsletterState } from "@/services/consent/consent";
import { getProductCards } from "@/services/catalog/products";
import { getUserWishlistIds } from "@/services/wishlist/wishlist";

/** Everything the /cont overview shows, in one call. Each block may be empty. */
export async function getAccountOverview(userId: string) {
  const [recentOrder, wishlistIds, latestQuiz, savedRoutine, newsletter] = await Promise.all([
    db.order.findFirst({
      where: { userId },
      orderBy: { placedAt: "desc" },
      select: {
        number: true,
        placedAt: true,
        status: true,
        total: true,
        _count: { select: { items: true } },
      },
    }),
    getUserWishlistIds(userId),
    db.quizResult.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        products: { orderBy: { rank: "asc" }, take: 1, select: { productId: true } },
      },
    }),
    db.savedRoutine.findFirst({
      where: { userId, routine: { active: true } },
      orderBy: { createdAt: "desc" },
      select: { routine: { select: { title: true, slug: true, summary: true } } },
    }),
    getNewsletterState(userId),
  ]);

  const savedProducts = await getProductCards(wishlistIds.slice(0, 4));
  const topPick = latestQuiz?.products[0];
  const recommendation = topPick ? ((await getProductCards([topPick.productId]))[0] ?? null) : null;

  return {
    recentOrder,
    savedProducts,
    savedCount: wishlistIds.length,
    latestQuiz: latestQuiz
      ? {
          id: latestQuiz.id,
          createdAt: latestQuiz.createdAt,
          product: recommendation,
          reason: null as string | null,
        }
      : null,
    savedRoutine: savedRoutine?.routine ?? null,
    newsletter,
  };
}
