/**
 * Idempotent seed: safe to run repeatedly (`pnpm db:seed`).
 * Taxonomy is upserted by slug; demo products are upserted and their
 * relations rebuilt on every run.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient, type Prisma } from "../../src/generated/prisma/client";
import { settingDefaults, type SettingKey } from "../../src/validation/settings";

import { demoProducts, demoSafety, demoUsage } from "./data/products";
import { articleCategories, articles, routines } from "./data/content";
import { quiz, quizQuestions } from "./data/quiz";
import { aromaProfiles, categories, demoBrands, needs, roles, tags } from "./data/taxonomy";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedRoles() {
  for (const role of roles) {
    await db.role.upsert({ where: { key: role.key }, create: role, update: role });
  }
}

async function seedCategories() {
  const ids = new Map<string, string>();
  for (const [index, category] of categories.entries()) {
    const data = {
      name: category.name,
      description: category.description,
      position: index,
      parentId: null,
    };
    const parent = await db.category.upsert({
      where: { slug: category.slug },
      create: { slug: category.slug, ...data },
      update: data,
    });
    ids.set(parent.slug, parent.id);
    for (const [childIndex, child] of category.children.entries()) {
      const childData = {
        name: child.name,
        description: child.description,
        position: childIndex,
        parentId: parent.id,
      };
      const created = await db.category.upsert({
        where: { slug: child.slug },
        create: { slug: child.slug, ...childData },
        update: childData,
      });
      ids.set(created.slug, created.id);
    }
  }
  return ids;
}

async function upsertBySlug<T extends { slug: string }>(
  items: readonly T[],
  upsert: (item: T, position: number) => Promise<{ id: string; slug: string }>,
) {
  const ids = new Map<string, string>();
  for (const [index, item] of items.entries()) {
    const row = await upsert(item, index);
    ids.set(row.slug, row.id);
  }
  return ids;
}

function requireId(map: Map<string, string>, slug: string, kind: string): string {
  const id = map.get(slug);
  if (!id) throw new Error(`Seed references unknown ${kind} "${slug}"`);
  return id;
}

async function seedSettings() {
  for (const [key, value] of Object.entries(settingDefaults) as Array<[SettingKey, unknown]>) {
    // Only create: never overwrite settings an admin may have edited.
    await db.siteSetting.upsert({
      where: { key },
      create: { key, value: value as Prisma.InputJsonValue },
      update: {},
    });
  }
}

/** Upserts the quiz by stable keys; answer weights are rebuilt from the seed on every run. */
async function seedQuiz(ids: {
  needs: Map<string, string>;
  aromas: Map<string, string>;
  tags: Map<string, string>;
}) {
  const q = await db.quiz.upsert({ where: { slug: quiz.slug }, create: quiz, update: quiz });
  for (const [position, question] of quizQuestions.entries()) {
    const data = {
      text: question.text,
      helpText: question.helpText ?? null,
      type: question.type,
      required: question.required,
      position,
    };
    const row = await db.quizQuestion.upsert({
      where: { quizId_key: { quizId: q.id, key: question.key } },
      create: { quizId: q.id, key: question.key, ...data },
      update: data,
    });
    for (const [answerPosition, answer] of question.answers.entries()) {
      const answerData = {
        text: answer.text,
        position: answerPosition,
        maxPrice: answer.maxPrice ?? null,
      };
      const a = await db.quizAnswer.upsert({
        where: { questionId_key: { questionId: row.id, key: answer.key } },
        create: { questionId: row.id, key: answer.key, ...answerData },
        update: answerData,
      });
      await db.$transaction([
        db.quizAnswerNeed.deleteMany({ where: { answerId: a.id } }),
        db.quizAnswerAromaProfile.deleteMany({ where: { answerId: a.id } }),
        db.quizAnswerTag.deleteMany({ where: { answerId: a.id } }),
        db.quizAnswerProductType.deleteMany({ where: { answerId: a.id } }),
        db.quizAnswerNeed.createMany({
          data: (answer.needs ?? []).map(([slug, weight]) => ({
            answerId: a.id,
            needId: requireId(ids.needs, slug, "need"),
            weight,
          })),
        }),
        db.quizAnswerAromaProfile.createMany({
          data: (answer.aromas ?? []).map(([slug, weight]) => ({
            answerId: a.id,
            aromaProfileId: requireId(ids.aromas, slug, "aroma profile"),
            weight,
          })),
        }),
        db.quizAnswerTag.createMany({
          data: (answer.tags ?? []).map(([slug, weight]) => ({
            answerId: a.id,
            tagId: requireId(ids.tags, slug, "tag"),
            weight,
          })),
        }),
        db.quizAnswerProductType.createMany({
          data: (answer.productTypes ?? []).map(([productType, weight]) => ({
            answerId: a.id,
            productType,
            weight,
          })),
        }),
      ]);
    }
  }
}

/** Demo routines: upserted by slug; steps, products, needs and tags rebuilt on every run. */
async function seedRoutines(ids: {
  products: Map<string, string>;
  needs: Map<string, string>;
  tags: Map<string, string>;
}) {
  const routineIds = new Map<string, string>();
  for (const r of routines) {
    const data = {
      title: r.title,
      summary: r.summary,
      description: r.description,
      timeOfDay: r.timeOfDay,
      difficulty: r.difficulty,
      durationMinutes: r.durationMinutes,
      frequency: r.frequency,
      featured: r.featured ?? false,
      active: true,
      isDemo: true,
    };
    const row = await db.routine.upsert({
      where: { slug: r.slug },
      create: { slug: r.slug, ...data },
      update: data,
    });
    routineIds.set(r.slug, row.id);
    await db.$transaction([
      db.routineStep.deleteMany({ where: { routineId: row.id } }),
      db.routineProduct.deleteMany({ where: { routineId: row.id } }),
      db.routineNeed.deleteMany({ where: { routineId: row.id } }),
      db.routineTag.deleteMany({ where: { routineId: row.id } }),
      db.routineProduct.createMany({
        data: r.products.map((p, position) => ({
          routineId: row.id,
          productId: requireId(ids.products, p.slug, "product"),
          position,
          isOptional: p.optional ?? false,
          note: p.note ?? null,
        })),
      }),
      db.routineStep.createMany({
        data: r.steps.map((step, position) => ({
          routineId: row.id,
          position,
          title: step.title,
          instructions: step.instructions,
          durationMinutes: step.minutes ?? null,
          productId: step.product ? requireId(ids.products, step.product, "product") : null,
        })),
      }),
      db.routineNeed.createMany({
        data: r.needs.map((slug) => ({
          routineId: row.id,
          needId: requireId(ids.needs, slug, "need"),
        })),
      }),
      db.routineTag.createMany({
        data: r.tags.map((slug) => ({
          routineId: row.id,
          tagId: requireId(ids.tags, slug, "tag"),
        })),
      }),
    ]);
  }
  return routineIds;
}

async function seedJournal(
  ids: {
    products: Map<string, string>;
    routines: Map<string, string>;
    tags: Map<string, string>;
  },
  withDemo: boolean,
) {
  const categoryIds = await upsertBySlug(articleCategories, (c, position) =>
    db.articleCategory.upsert({
      where: { slug: c.slug },
      create: { ...c, position },
      update: { ...c, position },
    }),
  );
  const now = Date.now();
  for (const a of withDemo ? articles : []) {
    const data = {
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      authorName: "Echipa Alchimia Rădăcinilor",
      categoryId: requireId(categoryIds, a.category, "article category"),
      status: "PUBLISHED" as const,
      publishedAt: new Date(now - a.daysAgo * 24 * 60 * 60 * 1000),
      featured: a.featured ?? false,
      isDemo: true,
    };
    const row = await db.article.upsert({
      where: { slug: a.slug },
      create: { slug: a.slug, ...data },
      update: data,
    });
    await db.$transaction([
      db.articleProduct.deleteMany({ where: { articleId: row.id } }),
      db.articleRoutine.deleteMany({ where: { articleId: row.id } }),
      db.articleTag.deleteMany({ where: { articleId: row.id } }),
      db.articleProduct.createMany({
        data: a.products.map((slug, position) => ({
          articleId: row.id,
          productId: requireId(ids.products, slug, "product"),
          position,
        })),
      }),
      db.articleRoutine.createMany({
        data: a.routines.map((slug, position) => ({
          articleId: row.id,
          routineId: requireId(ids.routines, slug, "routine"),
          position,
        })),
      }),
      db.articleTag.createMany({
        data: a.tags.map((slug) => ({
          articleId: row.id,
          tagId: requireId(ids.tags, slug, "tag"),
        })),
      }),
    ]);
  }
  return { categories: categoryIds.size, articles: withDemo ? articles.length : 0 };
}

async function main() {
  // SEED_DEMO=false: taxonomy, quiz, journal categories and settings only (production).
  const withDemo = process.env.SEED_DEMO !== "false";
  await seedRoles();
  const categoryIds = await seedCategories();

  const needIds = await upsertBySlug(needs, (n, position) =>
    db.need.upsert({
      where: { slug: n.slug },
      create: { ...n, position },
      update: { ...n, position },
    }),
  );
  const aromaIds = await upsertBySlug(aromaProfiles, (a, position) =>
    db.aromaProfile.upsert({
      where: { slug: a.slug },
      create: { ...a, position },
      update: { ...a, position },
    }),
  );
  const tagIds = await upsertBySlug(tags, (t) =>
    db.tag.upsert({ where: { slug: t.slug }, create: t, update: t }),
  );
  const brandIds = await upsertBySlug(withDemo ? demoBrands : [], (b) =>
    db.brand.upsert({
      where: { slug: b.slug },
      create: { ...b, isDemo: true },
      update: { ...b, isDemo: true },
    }),
  );

  // Pass 1: products themselves.
  const productIds = new Map<string, string>();
  const now = Date.now();
  for (const p of withDemo ? demoProducts : []) {
    const data = {
      name: p.name,
      sku: p.sku,
      brandId: requireId(brandIds, p.brand, "brand"),
      categoryId: requireId(categoryIds, p.category, "category"),
      productType: p.productType,
      shortDescription: p.shortDescription,
      description: p.description,
      usageInfo: demoUsage,
      safetyInfo: demoSafety,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      stock: p.stock,
      featured: p.featured ?? false,
      active: true,
      isDemo: true,
      createdAt: new Date(now - p.daysAgo * 24 * 60 * 60 * 1000),
    };
    const row = await db.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data },
      update: data,
    });
    productIds.set(p.slug, row.id);
  }

  // Pass 2: relations (rebuilt from scratch for demo products).
  for (const p of withDemo ? demoProducts : []) {
    const productId = requireId(productIds, p.slug, "product");
    await db.$transaction([
      db.productTag.deleteMany({ where: { productId } }),
      db.productNeed.deleteMany({ where: { productId } }),
      db.productAromaProfile.deleteMany({ where: { productId } }),
      db.productRelation.deleteMany({ where: { productId } }),
      db.kitItem.deleteMany({ where: { kitId: productId } }),
      db.productTag.createMany({
        data: (p.tags ?? []).map((slug) => ({ productId, tagId: requireId(tagIds, slug, "tag") })),
      }),
      db.productNeed.createMany({
        data: (p.needs ?? []).map(([slug, relevance]) => ({
          productId,
          needId: requireId(needIds, slug, "need"),
          relevance,
        })),
      }),
      db.productAromaProfile.createMany({
        data: (p.aromas ?? []).map(([slug, intensity]) => ({
          productId,
          aromaProfileId: requireId(aromaIds, slug, "aroma profile"),
          intensity,
        })),
      }),
      db.productRelation.createMany({
        data: (p.related ?? []).map((slug, position) => ({
          productId,
          relatedId: requireId(productIds, slug, "product"),
          type: "RELATED" as const,
          position,
        })),
      }),
      db.kitItem.createMany({
        data: (p.kitItems ?? []).map(([slug, quantity], position) => ({
          kitId: productId,
          componentId: requireId(productIds, slug, "product"),
          quantity,
          position,
        })),
      }),
    ]);
  }

  await seedQuiz({ needs: needIds, aromas: aromaIds, tags: tagIds });
  const routineIds = withDemo
    ? await seedRoutines({ products: productIds, needs: needIds, tags: tagIds })
    : new Map<string, string>();
  const journal = await seedJournal(
    { products: productIds, routines: routineIds, tags: tagIds },
    withDemo,
  );
  await seedSettings();

  console.log(
    `Seeded: ${categoryIds.size} categories, ${needIds.size} needs, ${aromaIds.size} aroma profiles, ` +
      `${tagIds.size} tags, ${brandIds.size} demo brands, ${productIds.size} demo products, ` +
      `${routineIds.size} demo routines, ${journal.categories} journal categories, ${journal.articles} demo articles.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
