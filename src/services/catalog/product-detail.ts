import "server-only";
import { cache } from "react";

import type { ProductType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

import { getProductCards } from "./products";
import type { ProductCardData, ProductImageData } from "./product-types";
import { rankSimilar, type SimilarityProfile } from "./similarity";

export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  productType: ProductType;
  shortDescription: string;
  description: string;
  usageInfo: string | null;
  safetyInfo: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  rating: number | null;
  reviewCount: number;
  isDemo: boolean;
  updatedAt: Date;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string };
  parentCategory: { name: string; slug: string } | null;
  images: ProductImageData[];
  tags: Array<{ name: string; slug: string }>;
  needs: Array<{ name: string; slug: string; description: string | null }>;
  aromas: Array<{
    name: string;
    slug: string;
    description: string | null;
    colorHex: string | null;
    intensity: number;
  }>;
  ingredients: Array<{ name: string; latinName: string | null; note: string | null }>;
  kitItems: Array<{ quantity: number; product: { name: string; slug: string; active: boolean } }>;
  routines: Array<{ title: string; slug: string; summary: string }>;
  seo: {
    seoTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    ogImage: string | null;
  } | null;
};

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  const p = await db.product.findFirst({
    where: { slug, active: true },
    include: {
      brand: { select: { name: true, slug: true, active: true } },
      category: {
        select: { name: true, slug: true, parent: { select: { name: true, slug: true } } },
      },
      images: {
        orderBy: { position: "asc" },
        include: { media: { select: { url: true, alt: true } } },
      },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
      needs: { orderBy: { relevance: "desc" }, include: { need: true } },
      aromaProfiles: { orderBy: { intensity: "desc" }, include: { aromaProfile: true } },
      ingredients: { orderBy: { position: "asc" }, include: { ingredient: true } },
      kitItems: {
        orderBy: { position: "asc" },
        include: { component: { select: { name: true, slug: true, active: true } } },
      },
      routineProducts: {
        where: { routine: { active: true } },
        include: { routine: { select: { title: true, slug: true, summary: true } } },
      },
      seo: { include: { ogImage: { select: { url: true } } } },
    },
  });
  if (!p) return null;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    productType: p.productType,
    shortDescription: p.shortDescription,
    description: p.description,
    usageInfo: p.usageInfo,
    safetyInfo: p.safetyInfo,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    rating: p.rating,
    reviewCount: p.reviewCount,
    isDemo: p.isDemo,
    updatedAt: p.updatedAt,
    brand: p.brand?.active ? { name: p.brand.name, slug: p.brand.slug } : null,
    category: { name: p.category.name, slug: p.category.slug },
    parentCategory: p.category.parent,
    images: p.images.map((i) => ({ url: i.media.url, alt: i.alt ?? i.media.alt })),
    tags: p.tags.map((t) => t.tag),
    needs: p.needs.map((n) => ({
      name: n.need.name,
      slug: n.need.slug,
      description: n.need.description,
    })),
    aromas: p.aromaProfiles.map((a) => ({
      name: a.aromaProfile.name,
      slug: a.aromaProfile.slug,
      description: a.aromaProfile.description,
      colorHex: a.aromaProfile.colorHex,
      intensity: a.intensity,
    })),
    ingredients: p.ingredients.map((i) => ({
      name: i.ingredient.name,
      latinName: i.ingredient.latinName,
      note: i.note,
    })),
    kitItems: p.kitItems.map((k) => ({ quantity: k.quantity, product: k.component })),
    routines: p.routineProducts.map((r) => r.routine),
    seo: p.seo
      ? {
          seoTitle: p.seo.seoTitle,
          metaDescription: p.seo.metaDescription,
          canonicalUrl: p.seo.canonicalUrl,
          noIndex: p.seo.noIndex,
          ogImage: p.seo.ogImage?.url ?? null,
        }
      : null,
  };
});

/** Similarity profiles of all active products (small catalogue; see DECISIONS D-021). */
export async function getSimilarityProfiles(): Promise<SimilarityProfile[]> {
  const rows = await db.product.findMany({
    where: { active: true },
    select: {
      id: true,
      stock: true,
      categoryId: true,
      tags: { select: { tagId: true } },
      needs: { select: { needId: true } },
      aromaProfiles: { select: { aromaProfileId: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    categoryId: r.categoryId,
    inStock: r.stock > 0,
    tags: r.tags.map((t) => t.tagId),
    needs: r.needs.map((n) => n.needId),
    aromas: r.aromaProfiles.map((a) => a.aromaProfileId),
  }));
}

/** Curated relations first, then similar products to fill up to `limit`. */
export async function getRelatedProducts(productId: string, limit = 4): Promise<ProductCardData[]> {
  const [curated, profiles] = await Promise.all([
    db.productRelation.findMany({
      where: { productId, type: { in: ["RELATED", "CROSS_SELL"] }, related: { active: true } },
      orderBy: { position: "asc" },
      select: { relatedId: true },
    }),
    getSimilarityProfiles(),
  ]);
  const curatedIds = curated.map((c) => c.relatedId).slice(0, limit);
  const source = profiles.find((p) => p.id === productId);
  const similar = source
    ? rankSimilar([source], profiles, { limit: limit - curatedIds.length, exclude: curatedIds })
    : [];
  return getProductCards([...curatedIds, ...similar]);
}
