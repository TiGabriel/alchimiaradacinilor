import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";
import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref } from "@/services/catalog/category-tree";
import { getProductSlugs } from "@/services/catalog/product-detail";
import { productHref } from "@/services/catalog/product-types";
import { getArticleCategories, listArticles } from "@/services/journal/journal";
import { listRoutines } from "@/services/routines/routines";

// Generated per request so new products appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, products, routines, articles, journalCategories] = await Promise.all([
    getCategoryTree(),
    getProductSlugs(),
    listRoutines(),
    listArticles(),
    getArticleCategories(),
  ]);
  const staticPaths = [
    "/",
    "/produse",
    "/descopera",
    "/descopera/nevoi",
    "/descopera/categorii",
    "/quiz",
    "/rutine",
    "/jurnal",
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
    ...routines.map((r) => ({
      url: siteUrl(`/rutine/${r.slug}`),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...journalCategories.map((c) => ({
      url: siteUrl(`/jurnal/${c.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
    ...articles.map((a) => ({
      url: siteUrl(`/jurnal/${a.slug}`),
      lastModified: a.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...products.map((p) => ({
      url: siteUrl(productHref(p)),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
