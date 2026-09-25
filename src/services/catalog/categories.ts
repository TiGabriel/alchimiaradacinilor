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
      _count: { select: { products: { where: { active: true } } } },
    },
  });
  return buildCategoryTree(
    rows.map(({ _count, ...row }) => ({ ...row, productCount: _count.products })),
  );
});
