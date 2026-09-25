import "server-only";
import { cache } from "react";

import { db } from "@/lib/db";
import { getProductCards } from "@/services/catalog/products";
import type { ProductCardData } from "@/services/catalog/product-types";
import { productTypeLabels } from "@/validation/product";

import { criteriaFromAnswers, type AnswerConfig } from "../recommendation/engine";
import { recommendProducts } from "../recommendation";

import { validateSubmission } from "./submission";

export const QUIZ_SLUG = "quiz-aromatic";
export const RESULT_SIZE = 6;

export type QuizView = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  questions: Array<{
    id: string;
    key: string;
    text: string;
    helpText: string | null;
    type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
    required: boolean;
    answers: Array<{ id: string; text: string }>;
  }>;
};

const answerInclude = {
  needs: { include: { need: { select: { slug: true, name: true } } } },
  aromaProfiles: { include: { aromaProfile: { select: { slug: true, name: true } } } },
  tags: { include: { tag: { select: { slug: true, name: true } } } },
  productTypes: true,
} as const;

async function loadQuiz(slug: string, includeInactive = false) {
  return db.quiz.findFirst({
    where: { slug, ...(includeInactive ? {} : { active: true }) },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: { answers: { orderBy: { position: "asc" }, include: answerInclude } },
      },
    },
  });
}

/** Public shape of the quiz (no weights are sent to the browser). */
export const getQuizView = cache(async (slug = QUIZ_SLUG): Promise<QuizView | null> => {
  const quiz = await loadQuiz(slug);
  if (!quiz || quiz.questions.length === 0) return null;
  return {
    id: quiz.id,
    slug: quiz.slug,
    title: quiz.title,
    description: quiz.description,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      key: q.key,
      text: q.text,
      helpText: q.helpText,
      type: q.type,
      required: q.required,
      answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
    })),
  };
});

type LoadedAnswer = NonNullable<
  Awaited<ReturnType<typeof loadQuiz>>
>["questions"][number]["answers"][number];

export function toAnswerConfig(a: LoadedAnswer): AnswerConfig {
  return {
    id: a.id,
    text: a.text,
    maxPrice: a.maxPrice,
    needs: a.needs.map((n) => ({ key: n.need.slug, label: n.need.name, weight: n.weight })),
    aromas: a.aromaProfiles.map((n) => ({
      key: n.aromaProfile.slug,
      label: n.aromaProfile.name,
      weight: n.weight,
    })),
    tags: a.tags.map((n) => ({ key: n.tag.slug, label: n.tag.name, weight: n.weight })),
    productTypes: a.productTypes.map((p) => ({
      type: p.productType,
      label: productTypeLabels[p.productType],
      weight: p.weight,
    })),
  };
}

export class QuizError extends Error {}

/**
 * Admin preview: runs the same engine on a set of answers without saving
 * anything and without personal context. Partial answer sets are allowed.
 */
export async function previewQuiz(answerIds: string[], slug = QUIZ_SLUG) {
  const quiz = await loadQuiz(slug, true);
  if (!quiz) throw new QuizError("Quiz-ul nu există.");
  const chosen = quiz.questions.flatMap((q) => q.answers).filter((a) => answerIds.includes(a.id));
  const criteria = criteriaFromAnswers(chosen.map(toAnswerConfig));
  const recommendations = await recommendProducts(criteria, { limit: RESULT_SIZE });
  return { criteria, recommendations };
}

/**
 * Validates answers against the DB, runs the shared engine and stores the
 * result (for the signed-in user, or a guest's anonymous id).
 */
export async function submitQuiz(input: {
  slug?: string;
  answerIds: string[];
  userId?: string | null;
  anonymousId?: string | null;
}): Promise<{ resultId: string }> {
  const quiz = await loadQuiz(input.slug ?? QUIZ_SLUG);
  if (!quiz) throw new QuizError("Quiz-ul nu este disponibil momentan.");

  const validation = validateSubmission(
    quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      type: q.type,
      required: q.required,
      answerIds: q.answers.map((a) => a.id),
    })),
    input.answerIds,
  );
  if (!validation.ok) throw new QuizError(validation.error);

  const chosen = quiz.questions
    .flatMap((q) => q.answers)
    .filter((a) => validation.answerIds.includes(a.id));
  const criteria = criteriaFromAnswers(chosen.map(toAnswerConfig));
  const recommendations = await recommendProducts(criteria, {
    limit: RESULT_SIZE,
    userId: input.userId,
  });

  const result = await db.quizResult.create({
    data: {
      quizId: quiz.id,
      userId: input.userId ?? null,
      anonymousId: input.userId ? null : (input.anonymousId ?? null),
      answers: { create: validation.answerIds.map((answerId) => ({ answerId })) },
      products: {
        create: recommendations.map((r, index) => ({
          productId: r.product.id,
          score: Math.round(r.score * 100),
          rank: index + 1,
          reason: r.explanation,
        })),
      },
    },
    select: { id: true },
  });
  return { resultId: result.id };
}

export type QuizResultView = {
  id: string;
  createdAt: Date;
  saved: boolean;
  answers: string[];
  items: Array<{ product: ProductCardData; reason: string | null; rank: number }>;
};

async function toResultView(result: {
  id: string;
  createdAt: Date;
  userId: string | null;
  answers: Array<{ answer: { text: string } }>;
  products: Array<{ productId: string; reason: string | null; rank: number }>;
}): Promise<QuizResultView> {
  const cards = await getProductCards(result.products.map((p) => p.productId));
  const byId = new Map(cards.map((c) => [c.id, c]));
  return {
    id: result.id,
    createdAt: result.createdAt,
    saved: result.userId !== null,
    answers: result.answers.map((a) => a.answer.text),
    // Products deactivated since the quiz simply drop out.
    items: result.products.flatMap((p) => {
      const product = byId.get(p.productId);
      return product ? [{ product, reason: p.reason, rank: p.rank }] : [];
    }),
  };
}

const resultInclude = {
  answers: {
    select: {
      answer: { select: { text: true, position: true, question: { select: { position: true } } } },
    },
  },
  products: { orderBy: { rank: "asc" }, select: { productId: true, reason: true, rank: true } },
} as const;

/** A result is visible only to its owner (the user, or the guest's anonymous cookie). */
export async function getQuizResultForViewer(
  id: string,
  viewer: { userId: string | null; anonymousId: string | null },
): Promise<QuizResultView | null> {
  const result = await db.quizResult.findUnique({ where: { id }, include: resultInclude });
  if (!result) return null;
  const owns =
    (viewer.userId && result.userId === viewer.userId) ||
    (!result.userId && viewer.anonymousId && result.anonymousId === viewer.anonymousId);
  if (!owns) return null;
  result.answers.sort(
    (a, b) =>
      a.answer.question.position - b.answer.question.position ||
      a.answer.position - b.answer.position,
  );
  return toResultView(result);
}

export async function listUserQuizResults(userId: string, take = 10): Promise<QuizResultView[]> {
  const results = await db.quizResult.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: resultInclude,
  });
  return Promise.all(results.map(toResultView));
}

/** After sign-in: attach the guest's quiz results to the account. */
export async function claimAnonymousResults(anonymousId: string, userId: string): Promise<number> {
  const { count } = await db.quizResult.updateMany({
    where: { anonymousId, userId: null },
    data: { userId, anonymousId: null },
  });
  return count;
}
