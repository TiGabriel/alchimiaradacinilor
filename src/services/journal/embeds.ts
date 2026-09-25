import "server-only";

import { db } from "@/lib/db";

/** Resolves embed slugs to active products and routines (unknown slugs render nothing). */
export async function getRoutineEmbeds(slugs: { products: string[]; routines: string[] }) {
  const [products, routines] = await Promise.all([
    slugs.products.length
      ? db.product.findMany({
          where: { slug: { in: slugs.products }, active: true },
          select: { id: true, slug: true },
        })
      : [],
    slugs.routines.length
      ? db.routine.findMany({
          where: { slug: { in: slugs.routines }, active: true },
          select: { slug: true, title: true, summary: true, durationMinutes: true },
        })
      : [],
  ]);
  return {
    productIdsBySlug: new Map(products.map((p) => [p.slug, [p.id]])),
    routines: new Map(routines.map((r) => [r.slug, r])),
  };
}
