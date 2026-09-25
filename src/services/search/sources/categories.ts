import "server-only";

import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref } from "@/services/catalog/category-tree";

import type { SearchSource } from "./types";

export const categorySource: SearchSource = {
  type: "category",
  label: "Categorii",
  async load() {
    const tree = await getCategoryTree();
    return tree.flatMap((category) => [
      {
        id: category.id,
        type: "category",
        title: category.name,
        subtitle: `${category.productCount} produse`,
        href: categoryHref(category),
        boost: 1.1,
      },
      ...category.children.map((child) => ({
        id: child.id,
        type: "category",
        title: child.name,
        subtitle: category.name,
        href: categoryHref(child, category),
        keywords: [category.name],
        boost: 1.1,
      })),
    ]);
  },
};
