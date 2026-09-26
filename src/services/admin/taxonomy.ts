import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { createsCycle, taxonomySchemas, type TaxonomyKind } from "@/validation/admin/taxonomy";

import { assertCan, type Actor } from "../auth/permissions";

import { AdminError } from "./errors";
import { upsertSeo } from "./seo";

export type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  position: number | null;
  active: boolean | null;
  parentId: string | null;
  website: string | null;
  colorHex: string | null;
  /** How many things use it (products, children, quiz answers…), for the list and delete rules. */
  usage: string;
  isDemo: boolean;
  /** Categories only: their SeoMeta (the other kinds have no page of their own). */
  seo?: {
    seoTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    ogImageId: string | null;
    ogImage: { url: string } | null;
  } | null;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export async function listTaxonomy(actor: Actor, kind: TaxonomyKind): Promise<TaxonomyRow[]> {
  assertCan(actor, "catalog:edit");
  const base = {
    description: null,
    position: null,
    active: null,
    parentId: null,
    website: null,
    colorHex: null,
    isDemo: false,
  };
  switch (kind) {
    case "categorii": {
      const rows = await db.category.findMany({
        orderBy: [{ position: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { products: true, children: true } },
          seo: { include: { ogImage: { select: { url: true } } } },
        },
      });
      return rows.map((r) => ({
        ...base,
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        position: r.position,
        active: r.active,
        parentId: r.parentId,
        seo: r.seo,
        usage: `${plural(r._count.products, "produs", "produse")}, ${plural(r._count.children, "subcategorie", "subcategorii")}`,
      }));
    }
    case "marci": {
      const rows = await db.brand.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      });
      return rows.map((r) => ({
        ...base,
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        active: r.active,
        website: r.website,
        isDemo: r.isDemo,
        usage: plural(r._count.products, "produs", "produse"),
      }));
    }
    case "colectii": {
      const rows = await db.collection.findMany({
        orderBy: { position: "asc" },
        include: { _count: { select: { products: true } } },
      });
      return rows.map((r) => ({
        ...base,
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        position: r.position,
        active: r.active,
        isDemo: r.isDemo,
        usage: plural(r._count.products, "produs", "produse"),
      }));
    }
    case "etichete": {
      const rows = await db.tag.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true, routines: true, articles: true } } },
      });
      return rows.map((r) => ({
        ...base,
        id: r.id,
        name: r.name,
        slug: r.slug,
        usage: `${plural(r._count.products, "produs", "produse")}, ${plural(r._count.routines, "rutină", "rutine")}, ${plural(r._count.articles, "articol", "articole")}`,
      }));
    }
    case "nevoi": {
      const rows = await db.need.findMany({
        orderBy: { position: "asc" },
        include: { _count: { select: { products: true, routines: true, quizAnswers: true } } },
      });
      return rows.map((r) => ({
        ...base,
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        position: r.position,
        usage: `${plural(r._count.products, "produs", "produse")}, ${plural(r._count.quizAnswers, "răspuns quiz", "răspunsuri quiz")}`,
      }));
    }
    case "arome": {
      const rows = await db.aromaProfile.findMany({
        orderBy: { position: "asc" },
        include: { _count: { select: { products: true, quizAnswers: true } } },
      });
      return rows.map((r) => ({
        ...base,
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        position: r.position,
        colorHex: r.colorHex,
        usage: `${plural(r._count.products, "produs", "produse")}, ${plural(r._count.quizAnswers, "răspuns quiz", "răspunsuri quiz")}`,
      }));
    }
  }
}

function slugTaken(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function saveTaxonomy(actor: Actor, kind: TaxonomyKind, raw: unknown, id?: string) {
  assertCan(actor, "catalog:edit");
  try {
    switch (kind) {
      case "categorii": {
        const { seoTitle, metaDescription, canonicalUrl, ogImageId, noIndex, ...data } =
          taxonomySchemas.categorii.parse(raw);
        const seo = { seoTitle, metaDescription, canonicalUrl, ogImageId, noIndex };
        if (id) {
          const all = await db.category.findMany({ select: { id: true, parentId: true } });
          if (createsCycle(id, data.parentId, new Map(all.map((c) => [c.id, c.parentId]))))
            throw new AdminError("O categorie nu poate fi propria subcategorie.", {
              parentId: "Alege o altă categorie părinte.",
            });
        }
        return await db.$transaction(async (tx) => {
          const existing = id
            ? await tx.category.findUnique({ where: { id }, select: { seoId: true } })
            : null;
          const seoId = await upsertSeo(tx, existing?.seoId ?? null, seo);
          return id
            ? await tx.category.update({ where: { id }, data: { ...data, seoId } })
            : await tx.category.create({ data: { ...data, seoId } });
        });
      }
      case "marci": {
        const data = taxonomySchemas.marci.parse(raw);
        return id
          ? await db.brand.update({ where: { id }, data })
          : await db.brand.create({ data });
      }
      case "colectii": {
        const data = taxonomySchemas.colectii.parse(raw);
        return id
          ? await db.collection.update({ where: { id }, data })
          : await db.collection.create({ data });
      }
      case "etichete": {
        const data = taxonomySchemas.etichete.parse(raw);
        return id ? await db.tag.update({ where: { id }, data }) : await db.tag.create({ data });
      }
      case "nevoi": {
        const data = taxonomySchemas.nevoi.parse(raw);
        return id ? await db.need.update({ where: { id }, data }) : await db.need.create({ data });
      }
      case "arome": {
        const data = taxonomySchemas.arome.parse(raw);
        return id
          ? await db.aromaProfile.update({ where: { id }, data })
          : await db.aromaProfile.create({ data });
      }
    }
  } catch (error) {
    if (slugTaken(error))
      throw new AdminError("Slug-ul este deja folosit.", { slug: "Alege un alt slug." });
    throw error;
  }
}

/** Deletes when nothing important depends on it; otherwise explains what to do instead. */
export async function deleteTaxonomy(actor: Actor, kind: TaxonomyKind, id: string) {
  assertCan(actor, "catalog:edit");
  switch (kind) {
    case "categorii": {
      const c = await db.category.findUnique({
        where: { id },
        include: { _count: { select: { products: true, children: true } } },
      });
      if (!c) return;
      if (c._count.children)
        throw new AdminError("Categoria are subcategorii. Mută-le sau șterge-le mai întâi.");
      if (c._count.products)
        throw new AdminError(
          "Categoria conține produse. Mută produsele într-o altă categorie mai întâi.",
        );
      await db.category.delete({ where: { id } });
      return;
    }
    case "marci": {
      const count = await db.product.count({ where: { brandId: id } });
      if (count)
        throw new AdminError("Marca are produse. Dezactiveaz-o sau schimbă marca produselor.");
      await db.brand.deleteMany({ where: { id } });
      return;
    }
    case "colectii":
      await db.collection.deleteMany({ where: { id } });
      return;
    case "etichete":
      await db.tag.deleteMany({ where: { id } });
      return;
    case "nevoi": {
      const answers = await db.quizAnswerNeed.count({ where: { needId: id } });
      if (answers)
        throw new AdminError("Nevoia este folosită în quiz. Scoate-o din răspunsuri mai întâi.");
      await db.need.deleteMany({ where: { id } });
      return;
    }
    case "arome": {
      const answers = await db.quizAnswerAromaProfile.count({ where: { aromaProfileId: id } });
      if (answers)
        throw new AdminError("Profilul este folosit în quiz. Scoate-l din răspunsuri mai întâi.");
      await db.aromaProfile.deleteMany({ where: { id } });
      return;
    }
  }
}
