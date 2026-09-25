import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { setPersonalizationConsent } from "@/services/consent/consent";
import {
  claimAnonymousResults,
  getQuizResultForViewer,
  QuizError,
  submitQuiz,
} from "@/services/quiz/quiz";
import { recommendProducts } from "@/services/recommendation";
import { toggleUserWishlist } from "@/services/wishlist/wishlist";

import { makeProduct, makeUser, meta } from "./helpers";

async function setupQuiz() {
  const seara = await db.need.create({ data: { slug: "seara", name: "Seară" } });
  const energie = await db.need.create({ data: { slug: "energie", name: "Energie" } });
  const floral = await db.aromaProfile.create({ data: { slug: "floral", name: "Floral" } });

  const lavender = await makeProduct({ slug: "lavender" });
  const lemon = await makeProduct({ slug: "lemon" });
  const blend = await makeProduct({ slug: "blend", price: 7900 });
  await db.productNeed.createMany({
    data: [
      { productId: lavender.id, needId: seara.id, relevance: 3 },
      { productId: blend.id, needId: seara.id, relevance: 2 },
      { productId: lemon.id, needId: energie.id, relevance: 3 },
    ],
  });
  await db.productAromaProfile.create({
    data: { productId: lavender.id, aromaProfileId: floral.id, intensity: 5 },
  });

  const quiz = await db.quiz.create({ data: { slug: "quiz-aromatic", title: "Quiz" } });
  const q1 = await db.quizQuestion.create({
    data: {
      quizId: quiz.id,
      key: "cauti",
      text: "Ce cauți?",
      type: "MULTIPLE_CHOICE",
      required: true,
      position: 0,
    },
  });
  const q2 = await db.quizQuestion.create({
    data: {
      quizId: quiz.id,
      key: "buget",
      text: "Buget",
      type: "SINGLE_CHOICE",
      required: false,
      position: 1,
    },
  });
  const aSeara = await db.quizAnswer.create({
    data: {
      questionId: q1.id,
      key: "seara",
      text: "Somn / seară",
      needs: { create: { needId: seara.id, weight: 3 } },
    },
  });
  const aFloral = await db.quizAnswer.create({
    data: {
      questionId: q1.id,
      key: "floral",
      text: "Floral",
      aromaProfiles: { create: { aromaProfileId: floral.id, weight: 2 } },
    },
  });
  const aEnergie = await db.quizAnswer.create({
    data: {
      questionId: q1.id,
      key: "energie",
      text: "Energie",
      needs: { create: { needId: energie.id, weight: 3 } },
    },
  });
  const aCheap = await db.quizAnswer.create({
    data: { questionId: q2.id, key: "ieftin", text: "Până în 60 lei", maxPrice: 6000 },
  });
  const aAny = await db.quizAnswer.create({
    data: { questionId: q2.id, key: "oricat", text: "Nu contează" },
  });
  return {
    products: { lavender, lemon, blend },
    answers: { aSeara, aFloral, aEnergie, aCheap, aAny },
  };
}

describe("quiz submission", () => {
  it("saves the result for a signed-in user with ranked products and explanations", async () => {
    const { products, answers } = await setupQuiz();
    const user = await makeUser();
    const { resultId } = await submitQuiz({
      answerIds: [answers.aSeara.id, answers.aFloral.id],
      userId: user.id,
    });

    const saved = await db.quizResult.findUniqueOrThrow({
      where: { id: resultId },
      include: { answers: true, products: { orderBy: { rank: "asc" } } },
    });
    expect(saved.userId).toBe(user.id);
    expect(saved.answers).toHaveLength(2);
    expect(saved.products.map((p) => p.productId)).toEqual([
      products.lavender.id,
      products.blend.id,
    ]);
    expect(saved.products[0]).toMatchObject({
      rank: 1,
      reason: "Recomandat pentru că ai ales: Seară + Floral.",
    });
    expect(saved.products[0]!.score).toBeGreaterThan(saved.products[1]!.score);

    const view = await getQuizResultForViewer(resultId, { userId: user.id, anonymousId: null });
    expect(view?.saved).toBe(true);
    expect(view?.answers).toEqual(["Somn / seară", "Floral"]);
  });

  it("applies the budget stored on the answer (a penalty, not an exclusion)", async () => {
    const { products, answers } = await setupQuiz();
    const anonymousId = "anon-123456789012345678";
    const noBudget = await submitQuiz({
      answerIds: [answers.aSeara.id, answers.aAny.id],
      anonymousId,
    });
    const cheap = await submitQuiz({
      answerIds: [answers.aSeara.id, answers.aCheap.id],
      anonymousId,
    });
    const score = async (resultId: string) =>
      (
        await db.quizResultProduct.findFirstOrThrow({
          where: { resultId, productId: products.blend.id },
        })
      ).score;

    // 79 lei blend vs a 60 lei ceiling: 12 points − 6 budget penalty.
    expect(await score(noBudget.resultId)).toBe(1200);
    expect(await score(cheap.resultId)).toBe(600);
    const ranked = await db.quizResultProduct.findMany({
      where: { resultId: cheap.resultId },
      orderBy: { rank: "asc" },
    });
    expect(ranked.map((p) => p.productId)).toEqual([products.lavender.id, products.blend.id]);
  });

  it("rejects unknown answers and missing required questions", async () => {
    const { answers } = await setupQuiz();
    await expect(submitQuiz({ answerIds: [answers.aCheap.id] })).rejects.toBeInstanceOf(QuizError);
    await expect(
      submitQuiz({ answerIds: ["01900000-0000-7000-8000-000000000000"] }),
    ).rejects.toBeInstanceOf(QuizError);
    await expect(
      submitQuiz({ answerIds: [answers.aSeara.id, answers.aCheap.id, answers.aAny.id] }),
    ).rejects.toThrow(/un singur răspuns/);
  });

  it("shows a guest result only to its owner and claims it after sign-in", async () => {
    const { answers } = await setupQuiz();
    const anonymousId = "anon-abcdefghijklmnopqrstu";
    const { resultId } = await submitQuiz({ answerIds: [answers.aEnergie.id], anonymousId });

    expect(await getQuizResultForViewer(resultId, { userId: null, anonymousId })).not.toBeNull();
    expect(
      await getQuizResultForViewer(resultId, {
        userId: null,
        anonymousId: "someone-else-000000000",
      }),
    ).toBeNull();

    const user = await makeUser();
    expect(await claimAnonymousResults(anonymousId, user.id)).toBe(1);
    const view = await getQuizResultForViewer(resultId, { userId: user.id, anonymousId: null });
    expect(view?.saved).toBe(true);
    expect(await getQuizResultForViewer(resultId, { userId: null, anonymousId })).toBeNull();
  });
});

describe("personal context requires consent", () => {
  it("uses the wishlist only after PERSONALIZATION consent", async () => {
    const { products } = await setupQuiz();
    const user = await makeUser();
    await toggleUserWishlist(user.id, products.blend.id);
    const criteria = {
      signals: [{ kind: "need" as const, key: "seara", label: "Seară", weight: 1 }],
    };

    const without = await recommendProducts(criteria, { limit: 5, userId: user.id });
    expect(without.every((r) => !r.explanation.includes("favorite"))).toBe(true);

    await setPersonalizationConsent(user.id, true, meta);
    const withConsent = await recommendProducts(criteria, { limit: 5, userId: user.id });
    const blend = withConsent.find((r) => r.product.id === products.blend.id);
    expect(blend?.explanation).toContain("produsele tale favorite");
  });
});
