import "server-only";
import { cache } from "react";

import { db } from "@/lib/db";

import { buildCategoryTree, type CategoryNode } from "./category-tree";

export { categoryHref, findCategoryPath, type CategoryNode } from "./category-tree";

/** Active category tree with product counts (one query, deduped per request). */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const rows = await db.category.findMany({
    where: { active: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      position: true,
      image: { select: { url: true } },
      seo: { select: { ogImage: { select: { url: true } } } },
      _count: { select: { products: { where: { active: true } } } },
    },
  });
  return buildCategoryTree(
    rows.map(({ _count, image, seo, ...row }) => ({
      ...row,
      // The editor uploads the photo as the category's social image; use it for the tiles too.
      image: image?.url ?? seo?.ogImage?.url ?? null,
      productCount: _count.products,
    })),
  );
});

/** Editor SEO fields of a category page (title, description, canonical, social image, noindex). */
export async function getCategorySeo(id: string) {
  const row = await db.category.findUnique({
    where: { id },
    select: {
      image: { select: { url: true } },
      seo: { include: { ogImage: { select: { url: true } } } },
    },
  });
  return row ? { ...row.seo, image: row.image?.url ?? null } : null;
}
