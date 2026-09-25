import "server-only";

import { db } from "@/lib/db";

import type { SearchSource } from "./types";

export const tagSource: SearchSource = {
  type: "tag",
  label: "Etichete",
  async load() {
    const tags = await db.tag.findMany({
      where: { products: { some: { product: { active: true } } } },
      select: { id: true, slug: true, name: true, _count: { select: { products: true } } },
    });
    return tags.map((t) => ({
      id: t.id,
      type: "tag",
      title: t.name,
      subtitle: "Etichetă",
      href: `/produse?eticheta=${t.slug}`,
    }));
  },
};
