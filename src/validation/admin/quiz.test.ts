import { describe, expect, it } from "vitest";

import { quizAnswerSchema, quizQuestionSchema } from "./quiz";

const id = "01900000-0000-7000-8000-000000000001";

describe("quiz admin schemas", () => {
  it("accepts negative weights and a budget in lei", () => {
    const parsed = quizAnswerSchema.parse({
      text: "Până în 60 lei",
      maxPrice: "60",
      productTypes: [{ type: "DIFFUSER", weight: "-6" }],
      needs: [{ id, weight: 3 }],
    });
    expect(parsed).toMatchObject({
      maxPrice: 6000,
      productTypes: [{ type: "DIFFUSER", weight: -6 }],
    });
  });

  it("rejects zero, out-of-range and duplicate weights", () => {
    expect(quizAnswerSchema.safeParse({ text: "A", needs: [{ id, weight: 0 }] }).success).toBe(
      false,
    );
    expect(quizAnswerSchema.safeParse({ text: "A", needs: [{ id, weight: 11 }] }).success).toBe(
      false,
    );
    expect(
      quizAnswerSchema.safeParse({
        text: "A",
        needs: [
          { id, weight: 1 },
          { id, weight: 2 },
        ],
      }).success,
    ).toBe(false);
    expect(quizQuestionSchema.safeParse({ text: "Ce?", type: "RANKING" }).success).toBe(false);
  });
});
