import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";
import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref } from "@/services/catalog/category-tree";
import { getProductSlugs } from "@/services/catalog/product-detail";
import { productHref } from "@/services/catalog/product-types";

// Generated per request so new products appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, products] = await Promise.all([getCategoryTree(), getProductSlugs()]);
  const staticPaths = [
    "/",
    "/produse",
    "/descopera",
    "/descopera/nevoi",
    "/descopera/categorii",
    "/contact",
  ];
  return [
    ...staticPaths.map((path) => ({
      url: siteUrl(path),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...tree.flatMap((category) => [
      { url: siteUrl(categoryHref(category)), changeFrequency: "weekly" as const, priority: 0.8 },
      ...category.children.map((child) => ({
        url: siteUrl(categoryHref(child, category)),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ]),
    ...products.map((p) => ({
      url: siteUrl(productHref(p)),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
