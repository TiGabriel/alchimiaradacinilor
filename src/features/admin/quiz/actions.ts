"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  adminPreviewQuiz,
  deleteQuizAnswer,
  deleteQuizQuestion,
  saveQuizAnswer,
  saveQuizQuestion,
} from "@/services/admin/quiz";

import { adminAction } from "../action";

const id = z.uuid();
const refresh = <T extends { ok: boolean }>(r: T) => {
  if (r.ok) revalidatePath("/admin/quiz");
  return r;
};

export async function saveQuestionAction(input: unknown, questionId?: string) {
  return refresh(
    await adminAction(
      "content:edit",
      async (actor) => {
        await saveQuizQuestion(actor, input, questionId ? id.parse(questionId) : undefined);
        return null;
      },
      "Întrebarea a fost salvată.",
    ),
  );
}

export async function deleteQuestionAction(questionId: string) {
  return refresh(
    await adminAction("content:edit", async (actor) => {
      await deleteQuizQuestion(actor, id.parse(questionId));
      return null;
    }),
  );
}

export async function saveAnswerAction(questionId: string, input: unknown, answerId?: string) {
  return refresh(
    await adminAction(
      "content:edit",
      async (actor) => {
        await saveQuizAnswer(
          actor,
          id.parse(questionId),
          input,
          answerId ? id.parse(answerId) : undefined,
        );
        return null;
      },
      "Răspunsul a fost salvat.",
    ),
  );
}

export async function deleteAnswerAction(answerId: string) {
  return refresh(
    await adminAction("content:edit", async (actor) => {
      await deleteQuizAnswer(actor, id.parse(answerId));
      return null;
    }),
  );
}

export async function previewQuizAction(answerIds: string[]) {
  return adminAction("content:edit", (actor) =>
    adminPreviewQuiz(actor, z.array(id).max(60).parse(answerIds)),
  );
}
