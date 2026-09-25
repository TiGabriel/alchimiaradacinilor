import "server-only";

import { db } from "@/lib/db";

import type { SearchSource } from "./types";

export const routineSource: SearchSource = {
  type: "routine",
  label: "Rutine",
  async load() {
    const rows = await db.routine.findMany({
      where: { active: true },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        needs: { select: { need: { select: { name: true } } } },
        tags: { select: { tag: { select: { name: true } } } },
        products: { select: { product: { select: { name: true } } } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      type: "routine",
      title: r.title,
      subtitle: r.summary,
      href: `/rutine/${r.slug}`,
      // Product names make "Lav" find the routines that use Lavender.
      keywords: [
        ...r.needs.map((n) => n.need.name),
        ...r.tags.map((t) => t.tag.name),
        ...r.products.map((p) => p.product.name),
      ],
    }));
  },
};
