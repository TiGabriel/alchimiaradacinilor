import "server-only";
import { cookies } from "next/headers";

import { generateToken } from "@/services/auth/tokens";

export const QUIZ_COOKIE = "ar_quiz";
const MAX_AGE = 180 * 24 * 60 * 60;

/** Opaque id that lets a guest reopen their own quiz results (and claim them after sign-up). */
export async function getAnonymousQuizId(): Promise<string | null> {
  const value = (await cookies()).get(QUIZ_COOKIE)?.value;
  return value && /^[A-Za-z0-9_-]{20,64}$/.test(value) ? value : null;
}

export async function ensureAnonymousQuizId(): Promise<string> {
  const existing = await getAnonymousQuizId();
  if (existing) return existing;
  const id = generateToken(24);
  (await cookies()).set(QUIZ_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
  return id;
}
