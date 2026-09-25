import "server-only";

import { db } from "@/lib/db";
import { getProductCardsBySlugs } from "@/services/catalog/products";
import type { ProductCardData } from "@/services/catalog/product-types";
import { listUserQuizResults } from "@/services/quiz/quiz";
import { recommendFromFavourites } from "@/services/recommendation";
import { getSetting } from "@/services/settings";

import {
  buildPersonalRow,
  MIN_ESSENTIALS,
  resolveEssentials,
  reviewerName,
  type Essential,
  type PersonalRow,
} from "./select";

/** "Cele 5 esențiale" from the `homepage` setting; empty when too few products resolve. */
export async function getHomeEssentials(): Promise<Array<Essential<ProductCardData>>> {
  const { essentials } = await getSetting("homepage");
  const products = await getProductCardsBySlugs(essentials.map((e) => e.slug));
  const resolved = resolveEssentials(essentials, products);
  return resolved.length >= MIN_ESSENTIALS ? resolved : [];
}

export type HomeReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  verified: boolean;
  createdAt: Date;
  product: { slug: string; name: string };
};

/**
 * Real, approved reviews only (never invented testimonials). Favours well-rated,
 * substantive reviews; the section is hidden when there are none.
 */
export async function getHomeReviews(take = 3): Promise<HomeReview[]> {
  const rows = await db.review.findMany({
    where: { status: "APPROVED", rating: { gte: 4 }, product: { active: true } },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: take * 4,
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      orderItemId: true,
      createdAt: true,
      user: { select: { firstName: true, lastName: true } },
      product: { select: { slug: true, name: true } },
    },
  });
  return rows
    .filter((r) => r.body.trim().length >= 20)
    .slice(0, take)
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: reviewerName(r.user.firstName, r.user.lastName),
      verified: r.orderItemId !== null,
      createdAt: r.createdAt,
      product: r.product,
    }));
}

/**
 * "Recomandat pentru tine" for a signed-in customer: the latest quiz result, topped
 * up with favourite-based suggestions (those require PERSONALIZATION consent).
 */
export async function getPersonalRow(
  userId: string,
  limit = 4,
): Promise<PersonalRow<ProductCardData> | null> {
  const [[latest], favourites] = await Promise.all([
    listUserQuizResults(userId, 1),
    recommendFromFavourites(userId, limit),
  ]);
  return buildPersonalRow(
    latest?.items.map((i) => ({ product: i.product, reason: i.reason })) ?? [],
    favourites.map((f) => ({ product: f.product, reason: f.explanation })),
    limit,
  );
}
