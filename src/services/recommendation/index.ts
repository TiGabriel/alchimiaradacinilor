import "server-only";
import { cache } from "react";

import { db } from "@/lib/db";
import { getProductCards } from "@/services/catalog/products";
import type { ProductCardData } from "@/services/catalog/product-types";
import { hasPersonalizationConsent } from "@/services/consent/consent";
import { getSetting } from "@/services/settings";

import {
  criteriaFromNeeds,
  criteriaFromProfiles,
  rankProducts,
  type Criteria,
  type EngineWeights,
  type ProductCandidate,
} from "./engine";

export type Recommendation = { product: ProductCardData; score: number; explanation: string };

/** Every active product as an engine candidate (one query, cached per request). */
export const loadProductCandidates = cache(async (): Promise<ProductCandidate[]> => {
  const rows = await db.product.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      active: true,
      featured: true,
      rating: true,
      reviewCount: true,
      productType: true,
      needs: { select: { relevance: true, need: { select: { slug: true } } } },
      aromaProfiles: { select: { intensity: true, aromaProfile: { select: { slug: true } } } },
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    stock: r.stock,
    active: r.active,
    featured: r.featured,
    rating: r.rating,
    reviewCount: r.reviewCount,
    productType: r.productType,
    needs: r.needs.map((n) => ({ key: n.need.slug, relevance: n.relevance })),
    aromas: r.aromaProfiles.map((a) => ({ key: a.aromaProfile.slug, intensity: a.intensity })),
    tags: r.tags.map((t) => t.tag.slug),
  }));
});

export async function getEngineWeights(): Promise<EngineWeights & { needSelection: number }> {
  return getSetting("recommendation");
}

/**
 * Personal context for the engine — only with PERSONALIZATION consent.
 * Purchases exclude products the customer already owns.
 */
export async function loadPersonalContext(
  userId: string | null | undefined,
): Promise<Criteria["context"] | undefined> {
  if (!userId || !(await hasPersonalizationConsent(userId))) return undefined;
  const [wishlist, orders, routines] = await Promise.all([
    db.wishlistItem.findMany({ where: { wishlist: { userId } }, select: { productId: true } }),
    db.orderItem.findMany({
      where: {
        order: { userId, status: { notIn: ["CANCELLED", "REFUNDED"] } },
        productId: { not: null },
      },
      select: { productId: true },
    }),
    db.routineProduct.findMany({
      where: { routine: { savedBy: { some: { userId } } } },
      select: { productId: true },
    }),
  ]);
  return {
    wishlistIds: wishlist.map((w) => w.productId),
    purchasedIds: orders.map((o) => o.productId!),
    routineProductIds: routines.map((r) => r.productId),
  };
}

/** The one entry point every surface uses (quiz, discovery, account, homepage). */
export async function recommendProducts(
  criteria: Criteria,
  options: { limit: number; userId?: string | null },
): Promise<Recommendation[]> {
  const [candidates, weights, context] = await Promise.all([
    loadProductCandidates(),
    getEngineWeights(),
    loadPersonalContext(options.userId),
  ]);
  const ranked = rankProducts(
    { ...criteria, context: context ?? criteria.context },
    candidates,
    weights,
    { limit: options.limit },
  );
  const cards = await getProductCards(ranked.map((r) => r.item.id));
  const byId = new Map(cards.map((c) => [c.id, c]));
  return ranked.flatMap((r) => {
    const product = byId.get(r.item.id);
    return product ? [{ product, score: r.score, explanation: r.explanation }] : [];
  });
}

export async function recommendForNeed(
  need: { slug: string; name: string },
  options: { limit: number; userId?: string | null },
) {
  const weights = await getEngineWeights();
  return recommendProducts(
    criteriaFromNeeds([{ key: need.slug, label: need.name }], weights.needSelection),
    options,
  );
}

/**
 * "Pe baza favoritelor tale": criteria built from the taxonomy of the
 * customer's favourites — only with personalisation consent.
 */
export async function recommendFromFavourites(
  userId: string,
  limit: number,
): Promise<Recommendation[]> {
  if (!(await hasPersonalizationConsent(userId))) return [];
  const favourites = await db.product.findMany({
    where: { active: true, wishlistItems: { some: { wishlist: { userId } } } },
    select: {
      id: true,
      needs: { select: { relevance: true, need: { select: { slug: true, name: true } } } },
      aromaProfiles: {
        select: { intensity: true, aromaProfile: { select: { slug: true, name: true } } },
      },
    },
  });
  if (favourites.length === 0) return [];
  const criteria = criteriaFromProfiles(
    favourites.map((f) => ({
      needs: f.needs.map((n) => ({ key: n.need.slug, relevance: n.relevance })),
      aromas: f.aromaProfiles.map((a) => ({ key: a.aromaProfile.slug, intensity: a.intensity })),
      tags: [],
      needLabels: Object.fromEntries(f.needs.map((n) => [n.need.slug, n.need.name])),
      aromaLabels: Object.fromEntries(
        f.aromaProfiles.map((a) => [a.aromaProfile.slug, a.aromaProfile.name]),
      ),
    })),
  );
  // Favourites themselves are excluded: this row is for discovering something new.
  return recommendProducts(
    { ...criteria, excludeIds: favourites.map((f) => f.id) },
    { limit, userId },
  );
}
