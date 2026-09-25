"use server";

import { z } from "zod";

import { QuizError, submitQuiz } from "@/services/quiz/quiz";

import { getCurrentUser } from "../auth/session";

import { ensureAnonymousQuizId } from "./anonymous";

export type QuizSubmitResult = { ok: true; resultId: string } | { ok: false; error: string };

const inputSchema = z.object({ answerIds: z.array(z.uuid()).min(1).max(60) });

export async function submitQuizAction(input: { answerIds: string[] }): Promise<QuizSubmitResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Răspunsurile nu sunt valide. Te rugăm să reîncepi quiz-ul." };
  const user = await getCurrentUser();
  try {
    const { resultId } = await submitQuiz({
      answerIds: parsed.data.answerIds,
      userId: user?.id ?? null,
      anonymousId: user ? null : await ensureAnonymousQuizId(),
    });
    return { ok: true, resultId };
  } catch (error) {
    if (error instanceof QuizError) return { ok: false, error: error.message };
    console.error("[quiz]", error);
    return { ok: false, error: "Nu am putut calcula recomandările. Te rugăm să încerci din nou." };
  }
}
