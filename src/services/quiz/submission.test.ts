import { describe, expect, it } from "vitest";

import { validateSubmission, type QuestionRule } from "./submission";

const questions: QuestionRule[] = [
  {
    id: "q1",
    text: "Ce cauți?",
    type: "MULTIPLE_CHOICE",
    required: true,
    answerIds: ["a1", "a2", "a3"],
  },
  { id: "q2", text: "Buget", type: "SINGLE_CHOICE", required: true, answerIds: ["b1", "b2"] },
  {
    id: "q3",
    text: "Ce ai acasă?",
    type: "MULTIPLE_CHOICE",
    required: false,
    answerIds: ["c1", "c2"],
  },
];

describe("validateSubmission", () => {
  it("accepts a complete submission and removes duplicates", () => {
    expect(validateSubmission(questions, ["a1", "a2", "a1", "b2"])).toEqual({
      ok: true,
      answerIds: ["a1", "a2", "b2"],
    });
  });

  it("allows skipping optional questions", () => {
    expect(validateSubmission(questions, ["a3", "b1"]).ok).toBe(true);
  });

  it("requires every required question", () => {
    expect(validateSubmission(questions, ["a1"])).toMatchObject({ ok: false, questionId: "q2" });
  });

  it("rejects several answers to a single-choice question", () => {
    expect(validateSubmission(questions, ["a1", "b1", "b2"])).toMatchObject({
      ok: false,
      questionId: "q2",
    });
  });

  it("rejects answers from outside the quiz", () => {
    expect(validateSubmission(questions, ["a1", "b1", "zzz"]).ok).toBe(false);
  });
});
