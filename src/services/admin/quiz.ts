import "server-only";

import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { quizAnswerSchema, quizQuestionSchema } from "@/validation/admin/quiz";

import { assertCan, type Actor } from "../auth/permissions";
import { previewQuiz, QUIZ_SLUG } from "../quiz/quiz";

import { AdminError } from "./errors";

/** The quiz with every weight, for the editor (never sent to customers). */
export async function getQuizEditor(actor: Actor) {
  assertCan(actor, "content:edit");
  const [quiz, needs, aromas, tags, usage] = await Promise.all([
    db.quiz.findUnique({
      where: { slug: QUIZ_SLUG },
      include: {
        questions: {
          orderBy: { position: "asc" },
          include: {
            answers: {
              orderBy: { position: "asc" },
              include: {
                needs: { select: { needId: true, weight: true } },
                aromaProfiles: { select: { aromaProfileId: true, weight: true } },
                tags: { select: { tagId: true, weight: true } },
                productTypes: { select: { productType: true, weight: true } },
              },
            },
          },
        },
        _count: { select: { results: true } },
      },
    }),
    db.need.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.aromaProfile.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.quizResultAnswer.groupBy({ by: ["answerId"], _count: true }),
  ]);
  const usedBy = new Map(usage.map((u) => [u.answerId, u._count]));
  return {
    quiz: quiz
      ? {
          ...quiz,
          questions: quiz.questions.map((q) => ({
            ...q,
            answers: q.answers.map((a) => ({ ...a, uses: usedBy.get(a.id) ?? 0 })),
          })),
        }
      : null,
    options: { needs, aromas, tags },
  };
}

async function quizId() {
  const quiz = await db.quiz.findUnique({ where: { slug: QUIZ_SLUG }, select: { id: true } });
  if (quiz) return quiz.id;
  return (await db.quiz.create({ data: { slug: QUIZ_SLUG, title: "Quiz aromatic" } })).id;
}

/** A stable key from the text (unique within its parent). */
function keyFrom(text: string, taken: string[]) {
  const base = slugify(text).slice(0, 40) || "item";
  let key = base;
  for (let i = 2; taken.includes(key); i++) key = `${base}-${i}`;
  return key;
}

export async function saveQuizQuestion(actor: Actor, raw: unknown, id?: string) {
  assertCan(actor, "content:edit");
  const data = quizQuestionSchema.parse(raw);
  const qid = await quizId();
  if (id) return db.quizQuestion.update({ where: { id }, data });
  const keys = (
    await db.quizQuestion.findMany({ where: { quizId: qid }, select: { key: true } })
  ).map((q) => q.key);
  return db.quizQuestion.create({ data: { ...data, quizId: qid, key: keyFrom(data.text, keys) } });
}

export async function saveQuizAnswer(actor: Actor, questionId: string, raw: unknown, id?: string) {
  assertCan(actor, "content:edit");
  const data = quizAnswerSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const base = { text: data.text, position: data.position, maxPrice: data.maxPrice };
    let answerId = id;
    if (answerId) {
      await tx.quizAnswer.update({ where: { id: answerId, questionId }, data: base });
    } else {
      const keys = (
        await tx.quizAnswer.findMany({ where: { questionId }, select: { key: true } })
      ).map((a) => a.key);
      answerId = (
        await tx.quizAnswer.create({ data: { ...base, questionId, key: keyFrom(data.text, keys) } })
      ).id;
    }
    await tx.quizAnswerNeed.deleteMany({ where: { answerId } });
    await tx.quizAnswerAromaProfile.deleteMany({ where: { answerId } });
    await tx.quizAnswerTag.deleteMany({ where: { answerId } });
    await tx.quizAnswerProductType.deleteMany({ where: { answerId } });
    const a = answerId;
    if (data.needs.length)
      await tx.quizAnswerNeed.createMany({
        data: data.needs.map((n) => ({ answerId: a, needId: n.id, weight: n.weight })),
      });
    if (data.aromas.length)
      await tx.quizAnswerAromaProfile.createMany({
        data: data.aromas.map((n) => ({ answerId: a, aromaProfileId: n.id, weight: n.weight })),
      });
    if (data.tags.length)
      await tx.quizAnswerTag.createMany({
        data: data.tags.map((n) => ({ answerId: a, tagId: n.id, weight: n.weight })),
      });
    if (data.productTypes.length)
      await tx.quizAnswerProductType.createMany({
        data: data.productTypes.map((p) => ({
          answerId: a,
          productType: p.type,
          weight: p.weight,
        })),
      });
    return { id: a };
  });
}

/** Answers already chosen by customers stay (their quiz history shows them); edit the text instead. */
export async function deleteQuizAnswer(actor: Actor, id: string) {
  assertCan(actor, "content:edit");
  if (await db.quizResultAnswer.count({ where: { answerId: id } }))
    throw new AdminError(
      "Răspunsul apare în rezultatele clienților. Modifică-l în loc să-l ștergi.",
    );
  await db.quizAnswer.deleteMany({ where: { id } });
}

export async function deleteQuizQuestion(actor: Actor, id: string) {
  assertCan(actor, "content:edit");
  if (await db.quizResultAnswer.count({ where: { answer: { questionId: id } } }))
    throw new AdminError(
      "Întrebarea are răspunsuri folosite de clienți. Modifică-o în loc s-o ștergi.",
    );
  await db.quizQuestion.deleteMany({ where: { id } });
}

/** Runs the real engine on the chosen answers (nothing is saved). */
export async function adminPreviewQuiz(actor: Actor, answerIds: string[]) {
  assertCan(actor, "content:edit");
  const { criteria, recommendations } = await previewQuiz(answerIds);
  return {
    signals: criteria.signals,
    budget: criteria.maxPrice ?? null,
    results: recommendations.map((r) => ({
      id: r.product.id,
      name: r.product.name,
      price: r.product.price,
      score: Math.round(r.score * 100) / 100,
      explanation: r.explanation,
    })),
  };
}
