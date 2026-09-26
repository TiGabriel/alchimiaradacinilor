import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { saveArticle, saveRoutine } from "@/services/admin/content";
import { deleteCoupon, listCouponsWithStats, saveCoupon } from "@/services/admin/coupons";
import { AdminError } from "@/services/admin/errors";
import { exportSubscribersCsv } from "@/services/admin/newsletter";
import {
  adminPreviewQuiz,
  deleteQuizAnswer,
  saveQuizAnswer,
  saveQuizQuestion,
} from "@/services/admin/quiz";
import { saveSetting } from "@/services/admin/settings";
import { ForbiddenError, type Actor } from "@/services/auth/permissions";
import { submitQuiz } from "@/services/quiz/quiz";
import { getSetting } from "@/services/settings";

import { makeProduct, makeVerifiedUser, placeTestOrder } from "./helpers";

async function actors() {
  const admin = await makeVerifiedUser({ email: "admin@example.ro" });
  const editor = await makeVerifiedUser({ email: "editor@example.ro" });
  return {
    admin: { id: admin.id, roles: ["admin"] } as Actor,
    editor: { id: editor.id, roles: ["editor"] } as Actor,
    customer: { id: editor.id, roles: ["customer"] } as Actor,
  };
}

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error("Expected the promise to reject.");
}

describe("quiz manager", () => {
  async function setup(editor: Actor) {
    const seara = await db.need.create({ data: { slug: "seara", name: "Seară" } });
    const energie = await db.need.create({ data: { slug: "energie", name: "Energie" } });
    const lavender = await makeProduct({ slug: "lavanda" });
    const lemon = await makeProduct({ slug: "lamaie" });
    await db.productNeed.createMany({
      data: [
        { productId: lavender.id, needId: seara.id, relevance: 3 },
        { productId: lemon.id, needId: energie.id, relevance: 3 },
      ],
    });
    const question = await saveQuizQuestion(editor, {
      text: "Ce cauți?",
      type: "MULTIPLE_CHOICE",
      required: true,
    });
    const answer = await saveQuizAnswer(editor, question.id, {
      text: "Seri liniștite",
      needs: [{ id: seara.id, weight: 3 }],
    });
    return { seara, energie, lavender, lemon, question, answer };
  }

  it("previews with the real engine and reflects weight changes", async () => {
    const { editor } = await actors();
    const { energie, lavender, lemon, question, answer } = await setup(editor);

    const before = await adminPreviewQuiz(editor, [answer.id]);
    expect(before.results[0]?.id).toBe(lavender.id);
    expect(before.signals.length).toBeGreaterThan(0);

    await saveQuizAnswer(
      editor,
      question.id,
      { text: "Seri liniștite", needs: [{ id: energie.id, weight: 4 }] },
      answer.id,
    );
    const after = await adminPreviewQuiz(editor, [answer.id]);
    expect(after.results[0]?.id).toBe(lemon.id);
    expect(after.results.map((r) => r.id)).not.toContain(lavender.id);
    // Nothing is stored by the preview.
    expect(await db.quizResult.count()).toBe(0);
  });

  it("keeps answers that customers already chose", async () => {
    const { editor } = await actors();
    const { answer } = await setup(editor);
    await submitQuiz({ answerIds: [answer.id], anonymousId: "anon-1" });

    const error = await rejection(deleteQuizAnswer(editor, answer.id));
    expect(error).toBeInstanceOf(AdminError);
    expect(await db.quizAnswer.count({ where: { id: answer.id } })).toBe(1);
  });

  it("rejects zero and out-of-range weights, and customers", async () => {
    const { editor, customer } = await actors();
    const { seara, question } = await setup(editor);
    await expect(
      saveQuizAnswer(editor, question.id, { text: "X", needs: [{ id: seara.id, weight: 0 }] }),
    ).rejects.toThrow();
    await expect(
      saveQuizAnswer(editor, question.id, { text: "X", needs: [{ id: seara.id, weight: 11 }] }),
    ).rejects.toThrow();
    await expect(adminPreviewQuiz(customer, [])).rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe("coupon admin", () => {
  const base = { code: "vara 10", type: "PERCENTAGE", value: "10" };

  it("normalises codes and refuses duplicates with a field error", async () => {
    const { admin } = await actors();
    const { id } = await saveCoupon(admin, base);
    expect((await db.coupon.findUniqueOrThrow({ where: { id } })).code).toBe("VARA10");

    const error = await rejection(saveCoupon(admin, { ...base, code: "vara10" }));
    expect(error).toBeInstanceOf(AdminError);
    expect((error as AdminError).fieldErrors).toHaveProperty("code");
  });

  it("is limited to order managers", async () => {
    const { editor } = await actors();
    await expect(saveCoupon(editor, base)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("reports usage and refuses to delete a used coupon", async () => {
    const { admin } = await actors();
    const buyer = await makeVerifiedUser({ email: "client@example.ro" });
    const product = await makeProduct({ price: 10000 });
    const { id } = await saveCoupon(admin, base);
    await db.cart.create({ data: { userId: buyer.id, couponId: id } });
    await placeTestOrder(buyer.id, [product.id]);

    const [stats] = await listCouponsWithStats(admin);
    expect(stats?.uses).toBe(1);
    expect(stats?.discountGiven).toBe(1000);

    await expect(deleteCoupon(admin, id)).rejects.toBeInstanceOf(AdminError);

    const unused = await saveCoupon(admin, { ...base, code: "NOU" });
    await deleteCoupon(admin, unused.id);
    expect(await db.coupon.count({ where: { id: unused.id } })).toBe(0);
  });
});

describe("content admin", () => {
  const routine = {
    title: "Seară liniștită",
    slug: "seara-linistita",
    summary: "Un ritual scurt pentru finalul zilei.",
    timeOfDay: "EVENING",
    difficulty: "BEGINNER",
    durationMinutes: 10,
    steps: [
      { title: "Aprinde difuzorul", instructions: "Adaugă câteva picături.", durationMinutes: 5 },
    ],
  };

  it("saves routines with steps and reports slug clashes on the field", async () => {
    const { editor } = await actors();
    const saved = await saveRoutine(editor, routine);
    expect(await db.routineStep.count({ where: { routineId: saved!.id } })).toBe(1);

    const error = await rejection(saveRoutine(editor, { ...routine, title: "Alta" }));
    expect((error as AdminError).fieldErrors).toHaveProperty("slug");
  });

  it("refuses article cards that point at missing products", async () => {
    const { editor } = await actors();
    const article = {
      title: "Despre lavandă",
      slug: "despre-lavanda",
      content: "Câteva rânduri despre lavandă și serile liniștite de vară.\n\n{{produs:nu-exista}}",
      status: "DRAFT",
    };
    const error = await rejection(saveArticle(editor, article));
    expect((error as AdminError).fieldErrors?.content).toContain("nu-exista");

    await makeProduct({ slug: "lavanda" });
    const saved = await saveArticle(editor, {
      ...article,
      content: "Câteva rânduri despre lavandă și serile liniștite de vară.\n\n{{produs:lavanda}}",
    });
    expect(saved?.slug).toBe("despre-lavanda");
  });
});

describe("settings and newsletter export", () => {
  it("validates settings with the same schema used for reading", async () => {
    const { admin, editor } = await actors();
    const seo = await getSetting("seo");
    await expect(
      saveSetting(admin, "seo", { ...seo, titleTemplate: "fără placeholder" }),
    ).rejects.toThrow();
    await saveSetting(admin, "seo", { ...seo, defaultTitle: "Alchimia" });
    expect((await getSetting("seo")).defaultTitle).toBe("Alchimia");

    await expect(saveSetting(admin, "necunoscut", {})).rejects.toBeInstanceOf(AdminError);
    await expect(saveSetting(editor, "seo", seo)).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("exports filtered subscribers as CSV without formula injection", async () => {
    const { admin } = await actors();
    await db.newsletterSubscriber.createMany({
      data: [
        { email: "=cmd@example.ro", status: "ACTIVE", interests: ["seara"] },
        { email: "altul@example.ro", status: "PENDING" },
      ],
    });
    const csv = await exportSubscribersCsv(admin, { status: "ACTIVE" });
    const lines = csv.trim().split(/\r?\n/);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("'=cmd@example.ro");
    expect(csv).not.toContain("altul@example.ro");
  });
});

describe("SEO fields", () => {
  it("stores category SEO and keeps noindex categories out of the sitemap", async () => {
    const { saveTaxonomy } = await import("@/services/admin/taxonomy");
    const { getCategorySeo } = await import("@/services/catalog/categories");
    const { getSitemapContent } = await import("@/services/seo");
    const { admin } = await actors();
    const category = await saveTaxonomy(admin, "categorii", {
      name: "Uleiuri",
      slug: "uleiuri",
      seoTitle: "Uleiuri esențiale pure",
      canonicalUrl: "/produse/uleiuri",
    });
    expect(await getCategorySeo(category.id)).toMatchObject({
      seoTitle: "Uleiuri esențiale pure",
      canonicalUrl: "/produse/uleiuri",
      noIndex: false,
    });
    expect((await getSitemapContent()).hiddenCategoryIds.has(category.id)).toBe(true);

    // Clearing every field keeps the (now empty) record and makes the page indexable again.
    await saveTaxonomy(admin, "categorii", { name: "Uleiuri", slug: "uleiuri" }, category.id);
    expect(await getCategorySeo(category.id)).toMatchObject({ seoTitle: null, canonicalUrl: null });
    expect((await getSitemapContent()).hiddenCategoryIds.has(category.id)).toBe(false);
  });

  it("saves canonical and noindex on routines", async () => {
    const { editor } = await actors();
    const saved = await saveRoutine(editor, {
      title: "Dimineață",
      slug: "dimineata",
      summary: "Un început de zi luminos, cu arome citrice.",
      timeOfDay: "MORNING",
      difficulty: "BEGINNER",
      durationMinutes: 5,
      steps: [{ title: "Deschide fereastra", instructions: "Aer proaspăt.", durationMinutes: 1 }],
      seo: { canonicalUrl: "https://exemplu.ro/rutina", noIndex: true },
    });
    const row = await db.routine.findUniqueOrThrow({
      where: { id: saved!.id },
      include: { seo: true },
    });
    expect(row.seo).toMatchObject({ canonicalUrl: "https://exemplu.ro/rutina", noIndex: true });
    expect((await import("@/services/seo").then((m) => m.getSitemapContent())).routines).toEqual(
      [],
    );
  });
});
