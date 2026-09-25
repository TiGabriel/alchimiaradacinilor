import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { addCartItem, loadCartView } from "@/services/cart/cart";
import { addRoutineToCart } from "@/services/cart/routine";
import {
  getArticlesForProduct,
  getRelatedArticles,
  listArticles,
} from "@/services/journal/journal";
import { criteriaForNeed, recommendArticles, recommendRoutines } from "@/services/recommendation";
import { getRoutinesForProduct, toggleSavedRoutine } from "@/services/routines/routines";
import { listSavedRoutines } from "@/services/account/routines";
import { buildIndex, groupHits, search } from "@/services/search/engine";
import { searchSources } from "@/services/search";

import { makeProduct, makeUser } from "./helpers";

async function setupContent() {
  const seara = await db.need.create({ data: { slug: "seara", name: "Seară" } });
  const energie = await db.need.create({ data: { slug: "energie", name: "Energie" } });
  const lavender = await db.product.update({
    where: { id: (await makeProduct({ slug: "lavender" })).id },
    data: { name: "Lavender" },
  });
  const blend = await makeProduct({ slug: "blend", stock: 0 });
  const retired = await db.product.update({
    where: { id: (await makeProduct({ slug: "retired" })).id },
    data: { active: false },
  });
  const lemon = await makeProduct({ slug: "lemon" });

  const evening = await db.routine.create({
    data: {
      slug: "ritual-de-seara",
      title: "Ritual de seară",
      summary: "Seara, liniștit.",
      needs: { create: { needId: seara.id } },
      products: {
        create: [
          { productId: lavender.id, position: 0 },
          { productId: blend.id, position: 1 },
          { productId: retired.id, position: 2 },
          { productId: lemon.id, position: 3, isOptional: true },
        ],
      },
    },
  });
  const morning = await db.routine.create({
    data: {
      slug: "dimineata",
      title: "Rutina de dimineață",
      summary: "Dimineața.",
      needs: { create: { needId: energie.id } },
      products: { create: { productId: lemon.id } },
    },
  });

  const category = await db.articleCategory.create({ data: { slug: "uleiuri", name: "Uleiuri" } });
  const other = await db.articleCategory.create({ data: { slug: "ghiduri", name: "Ghiduri" } });
  const published = {
    status: "PUBLISHED" as const,
    publishedAt: new Date(Date.now() - 86_400_000),
  };
  const lavArticle = await db.article.create({
    data: {
      slug: "lavanda-seara",
      title: "Lavanda, o aromă pentru seară",
      content: "Text despre lavandă.\n{{produs:lavender}}",
      categoryId: category.id,
      ...published,
      products: { create: { productId: lavender.id } },
      routines: { create: { routineId: evening.id } },
    },
  });
  const sibling = await db.article.create({
    data: {
      slug: "alt-ulei",
      title: "Alt ulei",
      content: "x",
      categoryId: category.id,
      ...published,
    },
  });
  await db.article.create({
    data: { slug: "ghid", title: "Ghid", content: "x", categoryId: other.id, ...published },
  });
  await db.article.create({
    data: {
      slug: "ciorna",
      title: "Ciornă despre lavandă",
      content: "x",
      categoryId: category.id,
      status: "DRAFT",
    },
  });
  return { lavender, blend, retired, lemon, evening, morning, lavArticle, sibling, seara };
}

describe("relationship queries", () => {
  it("finds routines and articles that include a product", async () => {
    const c = await setupContent();
    expect((await getRoutinesForProduct(c.lavender.id)).map((r) => r.slug)).toEqual([
      "ritual-de-seara",
    ]);
    expect((await getRoutinesForProduct(c.lemon.id)).map((r) => r.slug).sort()).toEqual([
      "dimineata",
      "ritual-de-seara",
    ]);
    expect((await getArticlesForProduct(c.lavender.id)).map((a) => a.slug)).toEqual([
      "lavanda-seara",
    ]);
  });

  it("lists only published articles, filters by category and searches without diacritics", async () => {
    await setupContent();
    expect((await listArticles()).map((a) => a.slug)).not.toContain("ciorna");
    expect((await listArticles({ categorySlug: "ghiduri" })).map((a) => a.slug)).toEqual(["ghid"]);
    expect((await listArticles({ query: "lavanda" })).map((a) => a.slug)).toEqual([
      "lavanda-seara",
    ]);
  });

  it("relates articles by category, routines and products", async () => {
    const c = await setupContent();
    expect((await getRelatedArticles(c.lavArticle.id)).map((a) => a.slug)).toEqual(["alt-ulei"]);
  });

  it("ranks routines and articles for a need with the shared engine", async () => {
    const c = await setupContent();
    const criteria = await criteriaForNeed({ slug: c.seara.slug, name: c.seara.name });
    expect((await recommendRoutines(criteria, 3)).map((r) => r.routine.slug)).toEqual([
      "ritual-de-seara",
    ]);
    expect((await recommendArticles(criteria, 3)).map((a) => a.slug)).toEqual(["lavanda-seara"]);
  });

  it("saves routines to the account and toggles them off", async () => {
    const c = await setupContent();
    const user = await makeUser();
    expect(await toggleSavedRoutine(user.id, c.evening.id)).toBe(true);
    expect((await listSavedRoutines(user.id)).map((r) => r.slug)).toEqual(["ritual-de-seara"]);
    expect(await toggleSavedRoutine(user.id, c.evening.id)).toBe(false);
    expect(await listSavedRoutines(user.id)).toEqual([]);
  });
});

describe("add routine to cart", () => {
  it("adds in-stock products once and reports what was skipped", async () => {
    const c = await setupContent();
    const guest = await addCartItem({ userId: null, token: null }, c.lemon.id, 2);
    const owner = { userId: null, token: guest.token };

    const result = await addRoutineToCart(owner, c.evening.id);
    expect(result.added).toEqual(["Lavender"]);
    expect(result.skipped.map((s) => [s.name, s.reason])).toEqual([
      [`Produs blend`, "out-of-stock"],
      [`Produs retired`, "unavailable"],
      [`Produs lemon`, "already-in-cart"],
    ]);
    const view = await loadCartView(owner);
    expect(view.lines.map((l) => [l.slug, l.quantity]).sort()).toEqual([
      ["lavender", 1],
      ["lemon", 2],
    ]);
  });

  it("creates a guest cart when there is none", async () => {
    const c = await setupContent();
    const result = await addRoutineToCart({ userId: null, token: null }, c.morning.id);
    expect(result.added).toHaveLength(1);
    expect(result.token).toBeTruthy();
  });
});

describe("site search across sources", () => {
  it('suggests the product, routines and articles for "Lav"', async () => {
    await setupContent();
    const docs = (await Promise.all(searchSources.map((s) => s.load()))).flat();
    const groups = groupHits(search(buildIndex(docs), "Lav"), searchSources, 5);
    const byType = Object.fromEntries(groups.map((g) => [g.type, g.hits.map((h) => h.doc.title)]));
    expect(byType.product).toContain("Lavender");
    expect(byType.routine).toContain("Ritual de seară");
    expect(byType.article).toContain("Lavanda, o aromă pentru seară");
    expect(byType.article).not.toContain("Ciornă despre lavandă");
  });
});
