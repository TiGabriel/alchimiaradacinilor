import "server-only";

import { db } from "@/lib/db";

import type { SearchSource } from "./types";

export const articleSource: SearchSource = {
  type: "article",
  label: "Jurnal",
  async load() {
    const rows = await db.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() } },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: { select: { name: true } },
        tags: { select: { tag: { select: { name: true } } } },
        products: { select: { product: { select: { name: true } } } },
      },
    });
    return rows.map((a) => ({
      id: a.id,
      type: "article",
      title: a.title,
      subtitle: a.excerpt ?? a.category?.name,
      href: `/jurnal/${a.slug}`,
      keywords: [
        a.category?.name ?? "",
        ...a.tags.map((t) => t.tag.name),
        ...a.products.map((p) => p.product.name),
      ].filter(Boolean),
      boost: 0.9,
    }));
  },
};
