import "server-only";
import { cookies } from "next/headers";

import { claimAnonymousResults } from "@/services/quiz/quiz";

import { QUIZ_COOKIE } from "../quiz/anonymous";

/**
 * Everything that follows a successful sign-in or registration: the guest's
 * quiz results move into the account (the wishlist is merged client-side,
 * because it lives in the browser's storage).
 */
export async function onSignedIn(userId: string) {
  const jar = await cookies();
  const quizId = jar.get(QUIZ_COOKIE)?.value;
  if (quizId) {
    try {
      await claimAnonymousResults(quizId, userId);
    } catch (error) {
      console.error("[auth] Could not claim quiz results", error);
    }
    jar.delete(QUIZ_COOKIE);
  }
}
