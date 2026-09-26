import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";
import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref } from "@/services/catalog/category-tree";
import { productHref } from "@/services/catalog/product-types";
import { getArticleCategories } from "@/services/journal/journal";
import { getSitemapContent } from "@/services/seo";

// Generated per request so new products appear without a rebuild.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [tree, { products, routines, articles, hiddenCategoryIds }, journalCategories] =
    await Promise.all([getCategoryTree(), getSitemapContent(), getArticleCategories()]);
  const staticPaths = [
    "/",
    "/produse",
    "/descopera",
    "/descopera/nevoi",
    "/descopera/categorii",
    "/quiz",
    "/rutine",
    "/jurnal",
    "/despre",
    "/intrebari-frecvente",
    "/contact",
  ];
  const legalPaths = [
    "/livrare-si-retur",
    "/politica-de-retur",
    "/termeni-si-conditii",
    "/politica-de-confidentialitate",
    "/politica-cookies",
  ];
  return [
    ...staticPaths.map((path) => ({
      url: siteUrl(path),
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...legalPaths.map((path) => ({
      url: siteUrl(path),
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
    ...tree.flatMap((category) => [
      ...(hiddenCategoryIds.has(category.id)
        ? []
        : [
            {
              url: siteUrl(categoryHref(category)),
              changeFrequency: "weekly" as const,
              priority: 0.8,
            },
          ]),
      ...category.children
        .filter((child) => !hiddenCategoryIds.has(child.id))
        .map((child) => ({
          url: siteUrl(categoryHref(child, category)),
          changeFrequency: "weekly" as const,
          priority: 0.7,
        })),
    ]),
    ...routines.map((r) => ({
      url: siteUrl(`/rutine/${r.slug}`),
      lastModified: r.updatedAt,
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
      lastModified: a.updatedAt,
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
