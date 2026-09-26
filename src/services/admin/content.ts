import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { startOfBucharestDay } from "@/lib/dates";
import { db } from "@/lib/db";
import { storeImage } from "@/lib/storage";
import { articleFormSchema, routineFormSchema } from "@/validation/admin/content";

import { assertCan, type Actor } from "../auth/permissions";
import { embeddedSlugs, parseArticleContent } from "../journal/content";

import { AdminError } from "./errors";
import { upsertSeo } from "./seo";

function slugClash(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
    throw new AdminError("Slug-ul este deja folosit.", { slug: "Alege un alt slug." });
  throw error;
}

export async function uploadCoverImage(actor: Actor, file: Blob, folder: "routines" | "articles") {
  assertCan(actor, "content:edit");
  const stored = await storeImage(file, { folder, maxBytes: 5 * 1024 * 1024, maxDimension: 2400 });
  const media = await db.mediaAsset.create({
    data: {
      storageKey: stored.key,
      url: stored.url,
      mimeType: stored.mimeType,
      width: stored.width,
      height: stored.height,
      sizeBytes: stored.sizeBytes,
      createdById: actor.id,
    },
  });
  return { id: media.id, url: media.url };
}

export async function getContentOptions(actor: Actor) {
  assertCan(actor, "content:edit");
  const [products, routines, articles, needs, tags, categories] = await Promise.all([
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    db.routine.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, slug: true },
    }),
    db.article.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.need.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.articleCategory.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);
  return { products, routines, articles, needs, tags, categories };
}

// ── Routines ────────────────────────────────────────────────────────────────

export async function listAdminRoutines(actor: Actor) {
  assertCan(actor, "content:edit");
  return db.routine.findMany({
    orderBy: [{ featured: "desc" }, { title: "asc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      timeOfDay: true,
      active: true,
      featured: true,
      isDemo: true,
      _count: { select: { steps: true, products: true, savedBy: true } },
    },
  });
}

export async function getAdminRoutine(actor: Actor, id: string) {
  assertCan(actor, "content:edit");
  return db.routine.findUnique({
    where: { id },
    include: {
      seo: { include: { ogImage: { select: { url: true } } } },
      image: { select: { url: true } },
      needs: { select: { needId: true } },
      tags: { select: { tagId: true } },
      products: { orderBy: { position: "asc" } },
      steps: { orderBy: { position: "asc" } },
      articles: { select: { articleId: true } },
    },
  });
}

export async function saveRoutine(actor: Actor, raw: unknown, id?: string) {
  assertCan(actor, "content:edit");
  const input = routineFormSchema.parse(raw);
  try {
    return await db.$transaction(async (tx) => {
      const existing = id
        ? await tx.routine.findUnique({ where: { id }, select: { seoId: true } })
        : null;
      if (id && !existing) throw new AdminError("Rutina nu mai există.");
      const data = {
        title: input.title,
        slug: input.slug,
        summary: input.summary,
        description: input.description ?? null,
        timeOfDay: input.timeOfDay,
        difficulty: input.difficulty,
        durationMinutes: input.durationMinutes,
        frequency: input.frequency ?? null,
        featured: input.featured,
        active: input.active,
        imageId: input.imageId,
        seoId: await upsertSeo(tx, existing?.seoId ?? null, input.seo),
      };
      const routine = id
        ? await tx.routine.update({ where: { id }, data })
        : await tx.routine.create({ data });
      await tx.routineNeed.deleteMany({ where: { routineId: routine.id } });
      await tx.routineTag.deleteMany({ where: { routineId: routine.id } });
      await tx.routineProduct.deleteMany({ where: { routineId: routine.id } });
      await tx.routineStep.deleteMany({ where: { routineId: routine.id } });
      if (input.needIds.length)
        await tx.routineNeed.createMany({
          data: input.needIds.map((needId) => ({ routineId: routine.id, needId })),
        });
      if (input.tagIds.length)
        await tx.routineTag.createMany({
          data: input.tagIds.map((tagId) => ({ routineId: routine.id, tagId })),
        });
      if (input.products.length)
        await tx.routineProduct.createMany({
          data: input.products.map((p, position) => ({
            routineId: routine.id,
            productId: p.id,
            position,
            isOptional: p.isOptional,
            note: p.note ?? null,
          })),
        });
      await tx.routineStep.createMany({
        data: input.steps.map((s, position) => ({
          routineId: routine.id,
          position,
          title: s.title,
          instructions: s.instructions,
          durationMinutes: s.durationMinutes,
          productId: s.productId,
        })),
      });
      return { id: routine.id, slug: routine.slug };
    });
  } catch (error) {
    slugClash(error);
  }
}

export async function deleteRoutine(actor: Actor, id: string) {
  assertCan(actor, "content:edit");
  await db.routine.deleteMany({ where: { id } });
}

// ── Articles ────────────────────────────────────────────────────────────────

export async function listAdminArticles(actor: Actor) {
  assertCan(actor, "content:edit");
  return db.article.findMany({
    orderBy: [{ status: "asc" }, { publishedAt: { sort: "desc", nulls: "first" } }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publishedAt: true,
      featured: true,
      isDemo: true,
      category: { select: { name: true } },
    },
  });
}

export async function getAdminArticle(actor: Actor, id: string) {
  assertCan(actor, "content:edit");
  return db.article.findUnique({
    where: { id },
    include: {
      seo: { include: { ogImage: { select: { url: true } } } },
      coverImage: { select: { url: true } },
      products: { orderBy: { position: "asc" }, select: { productId: true } },
      routines: { orderBy: { position: "asc" }, select: { routineId: true } },
      tags: { select: { tagId: true } },
    },
  });
}

/** Embeds must point at existing products/routines (typos would silently vanish otherwise). */
async function assertEmbedsExist(content: string) {
  const { products, routines } = embeddedSlugs(parseArticleContent(content));
  const [foundProducts, foundRoutines] = await Promise.all([
    db.product.findMany({ where: { slug: { in: products } }, select: { slug: true } }),
    db.routine.findMany({ where: { slug: { in: routines } }, select: { slug: true } }),
  ]);
  const missing = [
    ...products.filter((s) => !foundProducts.some((p) => p.slug === s)).map((s) => `produs „${s}”`),
    ...routines.filter((s) => !foundRoutines.some((r) => r.slug === s)).map((s) => `rutină „${s}”`),
  ];
  if (missing.length)
    throw new AdminError("Articolul include carduri către elemente inexistente.", {
      content: `Nu există: ${missing.join(", ")}.`,
    });
}

export async function saveArticle(actor: Actor, raw: unknown, id?: string) {
  assertCan(actor, "content:edit");
  const input = articleFormSchema.parse(raw);
  await assertEmbedsExist(input.content);
  try {
    return await db.$transaction(async (tx) => {
      const existing = id
        ? await tx.article.findUnique({ where: { id }, select: { seoId: true, publishedAt: true } })
        : null;
      if (id && !existing) throw new AdminError("Articolul nu mai există.");
      const publishedAt =
        input.status === "PUBLISHED"
          ? input.publishedOn
            ? startOfBucharestDay(input.publishedOn)
            : (existing?.publishedAt ?? new Date())
          : input.publishedOn
            ? startOfBucharestDay(input.publishedOn)
            : (existing?.publishedAt ?? null);
      const data = {
        title: input.title,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        content: input.content,
        authorName: input.authorName ?? null,
        categoryId: input.categoryId,
        status: input.status,
        publishedAt,
        featured: input.featured,
        coverImageId: input.coverImageId,
        seoId: await upsertSeo(tx, existing?.seoId ?? null, input.seo),
      };
      const article = id
        ? await tx.article.update({ where: { id }, data })
        : await tx.article.create({ data: { ...data, authorId: actor.id } });
      await tx.articleProduct.deleteMany({ where: { articleId: article.id } });
      await tx.articleRoutine.deleteMany({ where: { articleId: article.id } });
      await tx.articleTag.deleteMany({ where: { articleId: article.id } });
      if (input.productIds.length)
        await tx.articleProduct.createMany({
          data: input.productIds.map((productId, position) => ({
            articleId: article.id,
            productId,
            position,
          })),
        });
      if (input.routineIds.length)
        await tx.articleRoutine.createMany({
          data: input.routineIds.map((routineId, position) => ({
            articleId: article.id,
            routineId,
            position,
          })),
        });
      if (input.tagIds.length)
        await tx.articleTag.createMany({
          data: input.tagIds.map((tagId) => ({ articleId: article.id, tagId })),
        });
      return { id: article.id, slug: article.slug };
    });
  } catch (error) {
    slugClash(error);
  }
}

export async function deleteArticle(actor: Actor, id: string) {
  assertCan(actor, "content:edit");
  await db.article.deleteMany({ where: { id } });
}
