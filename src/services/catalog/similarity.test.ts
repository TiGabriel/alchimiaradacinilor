import { describe, expect, it } from "vitest";

import { rankSimilar, similarityScore, type SimilarityProfile } from "./similarity";

const p = (id: string, o: Partial<SimilarityProfile> = {}): SimilarityProfile => ({
  id,
  tags: [],
  needs: [],
  aromas: [],
  inStock: true,
  ...o,
});

const lavender = p("lavender", {
  needs: ["seara", "relaxare"],
  aromas: ["floral"],
  tags: ["cadou"],
  categoryId: "flori",
});
const blend = p("blend", {
  needs: ["seara"],
  aromas: ["floral", "lemnos"],
  categoryId: "amestecuri",
});
const lemon = p("lemon", { needs: ["energie"], aromas: ["citric"], categoryId: "citrice" });
const box = p("box", { tags: ["cadou"], categoryId: "accesorii" });
const soldOut = p("sold-out", { needs: ["seara", "relaxare"], aromas: ["floral"], inStock: false });

describe("similarityScore", () => {
  it("weights needs over aromas over tags", () => {
    expect(similarityScore(lavender, blend)).toBe(3 + 2);
    expect(similarityScore(lavender, box)).toBe(1);
    expect(similarityScore(lavender, lemon)).toBe(0);
  });

  it("is zero for the same product", () => {
    expect(similarityScore(lavender, lavender)).toBe(0);
  });
});

describe("rankSimilar", () => {
  it("ranks by score, skipping unrelated, out-of-stock and excluded items", () => {
    expect(rankSimilar([lavender], [lemon, box, blend, soldOut, lavender], { limit: 4 })).toEqual([
      "blend",
      "box",
    ]);
    expect(rankSimilar([lavender], [box, blend], { limit: 4, exclude: ["blend"] })).toEqual([
      "box",
    ]);
  });

  it("sums scores across several sources (e.g. a whole cart)", () => {
    const orange = p("orange", { needs: ["energie"], tags: ["cadou"] });
    expect(rankSimilar([lemon, box], [orange, blend], { limit: 1 })).toEqual(["orange"]);
  });

  it("respects the limit", () => {
    expect(rankSimilar([lavender], [blend, box], { limit: 1 })).toEqual(["blend"]);
  });
});
