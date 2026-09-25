import "server-only";
import { cache } from "react";

import type { RoutineDifficulty, RoutineTimeOfDay } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getProductCards } from "@/services/catalog/products";
import type { ProductCardData } from "@/services/catalog/product-types";

import type { Profile } from "../recommendation/engine";

export const timeOfDayLabels: Record<RoutineTimeOfDay, string> = {
  MORNING: "Dimineața",
  DAY: "În timpul zilei",
  EVENING: "Seara",
  ANYTIME: "Oricând",
};

export const difficultyLabels: Record<RoutineDifficulty, string> = {
  BEGINNER: "Pentru începători",
  INTERMEDIATE: "Intermediar",
  ADVANCED: "Avansat",
};

export type RoutineCardData = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  timeOfDay: RoutineTimeOfDay;
  difficulty: RoutineDifficulty;
  durationMinutes: number | null;
  productCount: number;
  image: { url: string; alt: string | null } | null;
  isDemo: boolean;
  needs: Array<{ slug: string; name: string }>;
};

const cardSelect = {
  id: true,
  slug: true,
  title: true,
  summary: true,
  timeOfDay: true,
  difficulty: true,
  durationMinutes: true,
  isDemo: true,
  image: { select: { url: true, alt: true } },
  needs: { select: { need: { select: { slug: true, name: true } } } },
  _count: { select: { products: true } },
} as const;

type CardRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  timeOfDay: RoutineTimeOfDay;
  difficulty: RoutineDifficulty;
  durationMinutes: number | null;
  isDemo: boolean;
  image: { url: string; alt: string | null } | null;
  needs: Array<{ need: { slug: string; name: string } }>;
  _count: { products: number };
};

function toCard(r: CardRow): RoutineCardData {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    summary: r.summary,
    timeOfDay: r.timeOfDay,
    difficulty: r.difficulty,
    durationMinutes: r.durationMinutes,
    productCount: r._count.products,
    image: r.image,
    isDemo: r.isDemo,
    needs: r.needs.map((n) => n.need),
  };
}

export async function listRoutines(
  filter: { needSlug?: string | null; featured?: boolean; take?: number } = {},
) {
  const rows = await db.routine.findMany({
    where: {
      active: true,
      ...(filter.needSlug ? { needs: { some: { need: { slug: filter.needSlug } } } } : {}),
      ...(filter.featured ? { featured: true } : {}),
    },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
    take: filter.take,
    select: cardSelect,
  });
  return rows.map(toCard);
}

/** Routine cards in the order of `ids`. */
export async function getRoutineCards(ids: string[]): Promise<RoutineCardData[]> {
  if (!ids.length) return [];
  const rows = await db.routine.findMany({
    where: { id: { in: ids }, active: true },
    select: cardSelect,
  });
  const byId = new Map(rows.map((r) => [r.id, toCard(r)]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}

/** "Rutine care includ acest produs". */
export async function getRoutinesForProduct(productId: string) {
  const rows = await db.routine.findMany({
    where: { active: true, products: { some: { productId } } },
    orderBy: [{ featured: "desc" }, { title: "asc" }],
    select: cardSelect,
  });
  return rows.map(toCard);
}

export type RoutineDetail = Awaited<ReturnType<typeof getRoutineBySlug>>;

export const getRoutineBySlug = cache(async (slug: string) => {
  const routine = await db.routine.findFirst({
    where: { slug, active: true },
    include: {
      image: { select: { url: true, alt: true } },
      needs: { select: { need: { select: { slug: true, name: true } } } },
      tags: { select: { tag: { select: { slug: true, name: true } } } },
      steps: {
        orderBy: { position: "asc" },
        include: { product: { select: { slug: true, name: true, active: true } } },
      },
      products: {
        orderBy: { position: "asc" },
        select: { productId: true, isOptional: true, note: true },
      },
      articles: {
        where: { article: { status: "PUBLISHED" } },
        orderBy: { position: "asc" },
        select: { article: { select: { slug: true, title: true, excerpt: true } } },
      },
      seo: { include: { ogImage: { select: { url: true } } } },
    },
  });
  if (!routine) return null;
  const cards = await getProductCards(routine.products.map((p) => p.productId));
  const byId = new Map(cards.map((c) => [c.id, c]));
  return {
    ...routine,
    productItems: routine.products.flatMap((p) => {
      const product = byId.get(p.productId);
      return product ? [{ product, optional: p.isOptional, note: p.note }] : [];
    }) as Array<{ product: ProductCardData; optional: boolean; note: string | null }>,
  };
});

export async function isRoutineSaved(userId: string, routineId: string) {
  return (await db.savedRoutine.count({ where: { userId, routineId } })) > 0;
}

export async function toggleSavedRoutine(userId: string, routineId: string): Promise<boolean> {
  const existing = await db.savedRoutine.findUnique({
    where: { userId_routineId: { userId, routineId } },
  });
  if (existing) {
    await db.savedRoutine.delete({ where: { userId_routineId: { userId, routineId } } });
    return false;
  }
  const routine = await db.routine.findFirst({
    where: { id: routineId, active: true },
    select: { id: true },
  });
  if (!routine) return false;
  await db.savedRoutine.create({ data: { userId, routineId } });
  return true;
}

/** Items for "add the whole routine to the cart". */
export async function getRoutineCartItems(routineId: string) {
  const rows = await db.routineProduct.findMany({
    where: { routineId, routine: { active: true } },
    orderBy: { position: "asc" },
    select: {
      isOptional: true,
      product: { select: { id: true, name: true, active: true, stock: true } },
    },
  });
  return rows.map((r) => ({
    productId: r.product.id,
    name: r.product.name,
    active: r.product.active,
    stock: r.product.stock,
    optional: r.isOptional,
  }));
}

/** Engine profiles for routines: own needs and tags + aromas of their products. */
export const loadRoutineProfiles = cache(
  async (): Promise<Array<Profile & { id: string; title: string }>> => {
    const rows = await db.routine.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        needs: { select: { need: { select: { slug: true } } } },
        tags: { select: { tag: { select: { slug: true } } } },
        products: {
          select: {
            product: {
              select: {
                aromaProfiles: {
                  select: { intensity: true, aromaProfile: { select: { slug: true } } },
                },
              },
            },
          },
        },
      },
    });
    return rows.map((r) => {
      const aromas = new Map<string, number>();
      for (const p of r.products) {
        for (const a of p.product.aromaProfiles)
          aromas.set(
            a.aromaProfile.slug,
            Math.max(aromas.get(a.aromaProfile.slug) ?? 0, a.intensity),
          );
      }
      return {
        id: r.id,
        title: r.title,
        // Needs set on the routine itself are its primary purpose.
        needs: r.needs.map((n) => ({ key: n.need.slug, relevance: 3 })),
        aromas: [...aromas].map(([key, intensity]) => ({ key, intensity })),
        tags: r.tags.map((t) => t.tag.slug),
      };
    });
  },
);
