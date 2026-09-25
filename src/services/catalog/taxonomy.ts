import "server-only";
import { cache } from "react";

import { db } from "@/lib/db";

export type TaxonomyEntry = {
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
  colorHex?: string | null;
};

export const getNeedsWithCounts = cache(async (): Promise<TaxonomyEntry[]> => {
  const needs = await db.need.findMany({
    orderBy: { position: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      _count: { select: { products: { where: { product: { active: true } } } } },
    },
  });
  return needs.map(({ _count, ...n }) => ({ ...n, productCount: _count.products }));
});

export const getAromasWithCounts = cache(async (): Promise<TaxonomyEntry[]> => {
  const aromas = await db.aromaProfile.findMany({
    orderBy: { position: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      colorHex: true,
      _count: { select: { products: { where: { product: { active: true } } } } },
    },
  });
  return aromas.map(({ _count, ...a }) => ({ ...a, productCount: _count.products }));
});
