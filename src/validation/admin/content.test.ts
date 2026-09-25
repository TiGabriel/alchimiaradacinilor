import { describe, expect, it } from "vitest";

import { articleFormSchema, routineFormSchema } from "./content";

const step = {
  title: "Pregătește încăperea",
  instructions: "Stinge lumina puternică și aerisește camera.",
};

describe("routineFormSchema", () => {
  it("accepts a routine with ordered steps", () => {
    const parsed = routineFormSchema.parse({
      title: "Ritual de seară",
      slug: "ritual-de-seara",
      summary: "Un sfârșit de zi mai lent, cu o aromă florală.",
      timeOfDay: "EVENING",
      difficulty: "BEGINNER",
      durationMinutes: "15",
      steps: [step, { ...step, title: "Pornește difuzorul", durationMinutes: "2" }],
    });
    expect(parsed.durationMinutes).toBe(15);
    expect(parsed.steps.map((s) => s.durationMinutes)).toEqual([null, 2]);
  });

  it("requires steps and refuses medical claims in instructions", () => {
    const base = {
      title: "Ritual",
      slug: "ritual",
      summary: "Un ritual simplu de seară.",
      timeOfDay: "EVENING",
      difficulty: "BEGINNER",
    } as const;
    expect(routineFormSchema.safeParse({ ...base, steps: [] }).success).toBe(false);
    const claim = routineFormSchema.safeParse({
      ...base,
      steps: [{ ...step, instructions: "Ameliorează insomnia." }],
    });
    expect(claim.success).toBe(false);
  });
});

describe("articleFormSchema", () => {
  it("validates status, date and content length", () => {
    const content =
      "Lavanda are o notă florală moale, potrivită serilor liniștite și ritualurilor simple.";
    expect(
      articleFormSchema.parse({
        title: "Lavanda",
        slug: "lavanda",
        content,
        status: "PUBLISHED",
        publishedOn: "2026-09-20",
      }),
    ).toMatchObject({
      publishedOn: "2026-09-20",
      status: "PUBLISHED",
    });
    expect(
      articleFormSchema.safeParse({
        title: "Lavanda",
        slug: "lavanda",
        content: "Prea scurt.",
        status: "DRAFT",
      }).success,
    ).toBe(false);
    expect(
      articleFormSchema.safeParse({ title: "Lavanda", slug: "lavanda", content, status: "LIVE" })
        .success,
    ).toBe(false);
  });
});
