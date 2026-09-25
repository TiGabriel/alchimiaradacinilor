import { describe, expect, it } from "vitest";

import { findMedicalClaims } from "./claims";

describe("findMedicalClaims", () => {
  it("flags therapeutic wording, with or without diacritics", () => {
    expect(findMedicalClaims("Ajută la insomnie și tratează anxietatea.")).toEqual([
      "tratează / tratament",
      "afecțiuni",
    ]);
    expect(findMedicalClaims("Vindecă rănile")).toEqual(["vindecă"]);
    expect(findMedicalClaims("Are efect antibacterian")).toEqual(["efecte terapeutice"]);
    expect(findMedicalClaims("Previne răceala")).toEqual(["previne"]);
  });

  it("accepts sensory, atmosphere and ritual copy", () => {
    expect(findMedicalClaims("Aromă florală pentru serile liniștite.")).toEqual([]);
    expect(
      findMedicalClaims(
        "Un ritual de seară: lumină caldă, o aromă calmă și câteva minute doar pentru tine.",
      ),
    ).toEqual([]);
    expect(findMedicalClaims(null)).toEqual([]);
  });
});
