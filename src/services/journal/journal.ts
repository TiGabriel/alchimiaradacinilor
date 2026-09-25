import "server-only";
import { cache } from "react";

import { db } from "@/lib/db";
import { normalizeForSearch } from "@/lib/text";

import type { Profile } from "../recommendation/engine";

import { rankRelatedArticles, readingTimeMinutes } from "./content";

export type ArticleCardData = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  readingMinutes: number;
  category: { slug: string; name: string } | null;
  cover: { url: string; alt: string | null } | null;
  author: string;
  isDemo: boolean;
  featured: boolean;
};

const published = { status: "PUBLISHED" as const, publishedAt: { lte: new Date() } };

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  publishedAt: true,
  isDemo: true,
  featured: true,
  authorName: true,
  author: { select: { firstName: true, lastName: true } },
  category: { select: { slug: true, name: true } },
  coverImage: { select: { url: true, alt: true } },
} as const;

type CardRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  publishedAt: Date | null;
  isDemo: boolean;
  featured: boolean;
  authorName: string | null;
  author: { firstName: string; lastName: string } | null;
  category: { slug: string; name: string } | null;
  coverImage: { url: string; alt: string | null } | null;
};

export function authorOf(a: {
  authorName: string | null;
  author: { firstName: string; lastName: string } | null;
}) {
  return (
    a.authorName ??
    (a.author ? `${a.author.firstName} ${a.author.lastName}` : "Echipa Alchimia Rădăcinilor")
  );
}

function toCard(a: CardRow): ArticleCardData {
  return {
    id: a.id,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt,
    readingMinutes: readingTimeMinutes(a.content),
    category: a.category,
    cover: a.coverImage,
    author: authorOf(a),
    isDemo: a.isDemo,
    featured: a.featured,
  };
}

export const getArticleCategories = cache(async () => {
  const rows = await db.articleCategory.findMany({
    orderBy: { position: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      _count: { select: { articles: { where: published } } },
    },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, articleCount: _count.articles }));
});

export async function getArticleCategory(slug: string) {
  return db.articleCategory.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true, description: true },
  });
}

/** Published articles, newest first; optional category and diacritic-insensitive text query. */
export async function listArticles(
  filter: { categorySlug?: string | null; query?: string | null; take?: number } = {},
) {
  const rows = await db.article.findMany({
    where: {
      ...published,
      ...(filter.categorySlug ? { category: { slug: filter.categorySlug } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    // Text search filters in memory, so it needs every row; otherwise limit in the query.
    take: filter.query ? undefined : filter.take,
    select: cardSelect,
  });
  let cards = rows.map(toCard);
  const q = filter.query ? normalizeForSearch(filter.query) : "";
  if (q) {
    const terms = q.split(" ");
    cards = cards.filter((c, i) => {
      const haystack = normalizeForSearch(
        `${c.title} ${c.excerpt ?? ""} ${c.category?.name ?? ""} ${rows[i]!.content}`,
      );
      return terms.every((t) => haystack.includes(t));
    });
  }
  return filter.take ? cards.slice(0, filter.take) : cards;
}

export async function getArticleCards(ids: string[]): Promise<ArticleCardData[]> {
  if (!ids.length) return [];
  const rows = await db.article.findMany({
    where: { id: { in: ids }, ...published },
    select: cardSelect,
  });
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

export const getArticleBySlug = cache(async (slug: string) => {
  const article = await db.article.findFirst({
    where: { slug, ...published },
    include: {
      author: { select: { firstName: true, lastName: true } },
      category: { select: { id: true, slug: true, name: true } },
      coverImage: { select: { url: true, alt: true } },
      tags: { select: { tag: { select: { id: true, slug: true, name: true } } } },
      products: { orderBy: { position: "asc" }, select: { productId: true } },
      routines: { orderBy: { position: "asc" }, select: { routineId: true } },
      seo: { include: { ogImage: { select: { url: true } } } },
    },
  });
  if (!article) return null;
  return {
    ...article,
    author: authorOf(article),
    readingMinutes: readingTimeMinutes(article.content),
  };
});

/** Related articles by shared category, routines, products and tags. */
export async function getRelatedArticles(articleId: string, limit = 3): Promise<ArticleCardData[]> {
  const rows = await db.article.findMany({
    where: published,
    select: {
      id: true,
      categoryId: true,
      publishedAt: true,
      tags: { select: { tagId: true } },
      products: { select: { productId: true } },
      routines: { select: { routineId: true } },
    },
  });
  const relations = rows.map((r) => ({
    id: r.id,
    categoryId: r.categoryId,
    publishedAt: r.publishedAt ?? new Date(0),
    tagIds: r.tags.map((t) => t.tagId),
    productIds: r.products.map((p) => p.productId),
    routineIds: r.routines.map((x) => x.routineId),
  }));
  const source = relations.find((r) => r.id === articleId);
  if (!source) return [];
  return getArticleCards(rankRelatedArticles(source, relations, limit));
}

/** Articles that mention a product or a routine (relationship queries). */
export async function getArticlesForProduct(productId: string, take = 3) {
  const rows = await db.article.findMany({
    where: { ...published, products: { some: { productId } } },
    orderBy: { publishedAt: "desc" },
    take,
    select: cardSelect,
  });
  return rows.map(toCard);
}

/** Engine profiles: needs/aromas of linked products and routines, plus the article's tags. */
export const loadArticleProfiles = cache(
  async (): Promise<Array<Profile & { id: string; title: string }>> => {
    const rows = await db.article.findMany({
      where: published,
      select: {
        id: true,
        title: true,
        tags: { select: { tag: { select: { slug: true } } } },
        products: {
          select: {
            product: {
              select: {
                needs: { select: { relevance: true, need: { select: { slug: true } } } },
                aromaProfiles: {
                  select: { intensity: true, aromaProfile: { select: { slug: true } } },
                },
              },
            },
          },
        },
        routines: {
          select: {
            routine: { select: { needs: { select: { need: { select: { slug: true } } } } } },
          },
        },
      },
    });
    return rows.map((r) => {
      const needs = new Map<string, number>();
      const aromas = new Map<string, number>();
      for (const { product } of r.products) {
        for (const n of product.needs)
          needs.set(n.need.slug, Math.max(needs.get(n.need.slug) ?? 0, n.relevance));
        for (const a of product.aromaProfiles)
          aromas.set(
            a.aromaProfile.slug,
            Math.max(aromas.get(a.aromaProfile.slug) ?? 0, a.intensity),
          );
      }
      for (const { routine } of r.routines)
        for (const n of routine.needs) needs.set(n.need.slug, 3);
      return {
        id: r.id,
        title: r.title,
        needs: [...needs].map(([key, relevance]) => ({ key, relevance })),
        aromas: [...aromas].map(([key, intensity]) => ({ key, intensity })),
        tags: r.tags.map((t) => t.tag.slug),
      };
    });
  },
);
