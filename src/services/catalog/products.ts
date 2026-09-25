import "server-only";
import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import type { CategoryNode } from "./category-tree";
import { getCategoryTree } from "./categories";
import {
  runListing,
  type CatalogFilters,
  type FacetLabels,
  type ListingResult,
  type ListingRow,
} from "./listing";
import type { ProductCardData } from "./product-types";

// ── Card data ───────────────────────────────────────────────────────────────

const cardSelect = {
  id: true,
  slug: true,
  name: true,
  shortDescription: true,
  productType: true,
  price: true,
  compareAtPrice: true,
  rating: true,
  reviewCount: true,
  stock: true,
  isDemo: true,
  brand: { select: { name: true } },
  images: {
    orderBy: { position: "asc" },
    take: 2,
    select: { alt: true, media: { select: { url: true, alt: true } } },
  },
  aromaProfiles: {
    orderBy: { intensity: "desc" },
    take: 1,
    select: { aromaProfile: { select: { colorHex: true } } },
  },
  tags: { where: { tag: { slug: "nou" } }, select: { tagId: true } },
} satisfies Prisma.ProductSelect;

type CardRow = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

function toCard(p: CardRow): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    brandName: p.brand?.name ?? null,
    productType: p.productType,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock: p.stock,
    isDemo: p.isDemo,
    isNew: p.tags.length > 0,
    images: p.images.map((i) => ({ url: i.media.url, alt: i.alt ?? i.media.alt })),
    tone: p.aromaProfiles[0]?.aromaProfile.colorHex ?? null,
  };
}

/** Active products by id, returned in the order of `ids`. */
export async function getProductCards(ids: string[]): Promise<ProductCardData[]> {
  if (ids.length === 0) return [];
  const rows = await db.product.findMany({
    where: { id: { in: ids }, active: true },
    select: cardSelect,
  });
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCardData[]> {
  const rows = await db.product.findMany({
    where: { active: true, featured: true },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take: limit,
    select: cardSelect,
  });
  return rows.map(toCard);
}

// ── Listing ─────────────────────────────────────────────────────────────────

/** Category ids of a node and all its descendants. */
function subtreeIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap(subtreeIds)];
}

async function loadListingRows(categoryIds: string[] | null): Promise<ListingRow[]> {
  const rows = await db.product.findMany({
    where: { active: true, ...(categoryIds ? { categoryId: { in: categoryIds } } : {}) },
    select: {
      id: true,
      price: true,
      rating: true,
      reviewCount: true,
      stock: true,
      featured: true,
      createdAt: true,
      brand: { select: { slug: true, active: true } },
      category: { select: { slug: true, parent: { select: { slug: true } } } },
      tags: { select: { tag: { select: { slug: true } } } },
      needs: { select: { need: { select: { slug: true } } } },
      aromaProfiles: { select: { aromaProfile: { select: { slug: true } } } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    price: r.price,
    rating: r.rating,
    reviewCount: r.reviewCount,
    stock: r.stock,
    featured: r.featured,
    createdAt: r.createdAt,
    brand: r.brand?.active ? r.brand.slug : null,
    categories: [r.category.slug, ...(r.category.parent ? [r.category.parent.slug] : [])],
    tags: r.tags.map((t) => t.tag.slug),
    needs: r.needs.map((n) => n.need.slug),
    aromas: r.aromaProfiles.map((a) => a.aromaProfile.slug),
  }));
}

/** Human labels for every facet value (taxonomy tables are the source of truth). */
export const getFacetLabels = cache(async (): Promise<FacetLabels> => {
  const [tree, brands, tags, needs, aromas] = await Promise.all([
    getCategoryTree(),
    db.brand.findMany({ where: { active: true }, select: { slug: true, name: true } }),
    db.tag.findMany({ select: { slug: true, name: true } }),
    db.need.findMany({ select: { slug: true, name: true, position: true } }),
    db.aromaProfile.findMany({
      select: { slug: true, name: true, colorHex: true, position: true },
    }),
  ]);
  return {
    // Only top-level categories are offered as a facet (subcategories roll up).
    categorie: new Map(tree.map((c, position) => [c.slug, { label: c.name, position }])),
    brand: new Map(brands.map((b) => [b.slug, { label: b.name }])),
    eticheta: new Map(tags.map((t) => [t.slug, { label: t.name }])),
    nevoie: new Map(needs.map((n) => [n.slug, { label: n.name, position: n.position }])),
    aroma: new Map(
      aromas.map((a) => [a.slug, { label: a.name, color: a.colorHex, position: a.position }]),
    ),
  };
});

export type CatalogPageData = ListingResult & { products: ProductCardData[] };

/** A listing page for the whole catalogue (scope = null) or a category subtree. */
export async function getCatalogPage(
  scope: CategoryNode | null,
  filters: CatalogFilters,
): Promise<CatalogPageData> {
  const [rows, labels] = await Promise.all([
    loadListingRows(scope ? subtreeIds(scope) : null),
    getFacetLabels(),
  ]);
  const result = runListing(rows, filters, labels);
  return { ...result, products: await getProductCards(result.ids) };
}
