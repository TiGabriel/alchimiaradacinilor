/** Quiz submission rules — pure and tested. */

export type QuestionRule = {
  id: string;
  text: string;
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  required: boolean;
  answerIds: string[];
};

export type SubmissionResult =
  { ok: true; answerIds: string[] } | { ok: false; error: string; questionId?: string };

/**
 * Accepts only answers that belong to the quiz, at most one per single-choice
 * question, and every required question answered. Duplicates are ignored.
 */
export function validateSubmission(
  questions: QuestionRule[],
  selected: string[],
): SubmissionResult {
  const unique = [...new Set(selected)];
  const owner = new Map<string, QuestionRule>();
  for (const q of questions) for (const a of q.answerIds) owner.set(a, q);

  for (const id of unique) {
    if (!owner.has(id))
      return {
        ok: false,
        error: "Unul dintre răspunsuri nu mai este valid. Te rugăm să reîncepi quiz-ul.",
      };
  }
  for (const q of questions) {
    const picked = unique.filter((id) => owner.get(id) === q);
    if (q.required && picked.length === 0)
      return { ok: false, error: `Răspunde la întrebarea „${q.text}”.`, questionId: q.id };
    if (q.type === "SINGLE_CHOICE" && picked.length > 1) {
      return {
        ok: false,
        error: `La întrebarea „${q.text}” poți alege un singur răspuns.`,
        questionId: q.id,
      };
    }
  }
  return { ok: true, answerIds: unique };
}
