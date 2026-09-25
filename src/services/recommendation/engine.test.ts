import { describe, expect, it } from "vitest";

import {
  criteriaFromAnswers,
  criteriaFromNeeds,
  explain,
  mergeSignals,
  rankProducts,
  rankProfiles,
  scoreProfile,
  type AnswerConfig,
  type EngineWeights,
  type ProductCandidate,
  type Signal,
} from "./engine";

const weights: EngineWeights = {
  need: 2,
  aroma: 1.5,
  tag: 1,
  productType: 1.5,
  budgetPenalty: 6,
  wishlistAffinity: 1,
  routineAffinity: 1,
  viewedAffinity: 0.5,
};

const product = (o: Partial<ProductCandidate> & { id: string }): ProductCandidate => ({
  name: o.id,
  price: 5000,
  stock: 10,
  active: true,
  featured: false,
  rating: null,
  reviewCount: 0,
  needs: [],
  aromas: [],
  tags: [],
  productType: "INDIVIDUAL_OIL",
  ...o,
});

const lavender = product({
  id: "lavender",
  needs: [
    { key: "relaxare", relevance: 3 },
    { key: "seara", relevance: 3 },
  ],
  aromas: [{ key: "floral", intensity: 5 }],
});
const lemon = product({
  id: "lemon",
  needs: [{ key: "energie", relevance: 2 }],
  aromas: [{ key: "citric", intensity: 5 }],
});
const blend = product({
  id: "blend",
  productType: "BLEND",
  price: 7900,
  needs: [
    { key: "seara", relevance: 3 },
    { key: "relaxare", relevance: 3 },
  ],
  aromas: [{ key: "floral", intensity: 4 }],
});
const diffuser = product({
  id: "diffuser",
  productType: "DIFFUSER",
  price: 18900,
  needs: [{ key: "casa", relevance: 2 }],
});

const sig = (kind: Signal["kind"], key: string, weight = 1, label = key): Signal => ({
  kind,
  key,
  label,
  weight,
});

describe("scoreProfile", () => {
  it("multiplies signal weight × engine weight × product relevance/intensity", () => {
    const [need, aroma] = scoreProfile(
      lavender,
      [sig("need", "relaxare", 3, "Relaxare"), sig("aroma", "floral", 2, "Floral")],
      weights,
    );
    expect(need).toMatchObject({ label: "Relaxare", points: 3 * 2 * 3 });
    expect(aroma).toMatchObject({ label: "Floral", points: 2 * 1.5 * (5 / 3) });
  });

  it("scores tags and product types, and allows negative weights", () => {
    const tagged = product({ id: "t", tags: ["cadou"], productType: "DIFFUSER" });
    const [tag, type] = scoreProfile(
      tagged,
      [sig("tag", "cadou", 2), sig("productType", "DIFFUSER", -4)],
      weights,
    );
    expect(tag!.points).toBe(2);
    expect(type!.points).toBe(-6);
  });

  it("ignores signals the product does not match", () => {
    expect(scoreProfile(lemon, [sig("need", "seara", 3)], weights)).toEqual([]);
  });
});

describe("rankProducts", () => {
  const all = [lavender, lemon, blend, diffuser];

  it("ranks by weighted matches", () => {
    const ranked = rankProducts(
      { signals: [sig("need", "seara", 3), sig("aroma", "floral", 2)] },
      all,
      weights,
    );
    expect(ranked.map((r) => r.item.id)).toEqual(["lavender", "blend"]);
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
  });

  it("is deterministic: the same input always gives the same order", () => {
    const criteria = { signals: [sig("need", "relaxare", 2), sig("need", "energie", 2)] };
    const first = rankProducts(criteria, all, weights).map((r) => r.item.id);
    for (let i = 0; i < 5; i++) {
      expect(rankProducts(criteria, [...all].reverse(), weights).map((r) => r.item.id)).toEqual(
        first,
      );
    }
  });

  it("weights change the ranking without code changes", () => {
    const criteria = { signals: [sig("need", "energie", 1), sig("aroma", "floral", 1)] };
    const needHeavy = rankProducts(criteria, [lavender, lemon], { ...weights, need: 5, aroma: 1 });
    const aromaHeavy = rankProducts(criteria, [lavender, lemon], { ...weights, need: 1, aroma: 5 });
    expect(needHeavy[0]!.item.id).toBe("lemon");
    expect(aromaHeavy[0]!.item.id).toBe("lavender");
  });

  it("breaks ties by featured, then rating, then review count, then stock, then name", () => {
    const base = { needs: [{ key: "casa", relevance: 1 }] };
    const criteria = { signals: [sig("need", "casa", 1)] };
    const order = (items: ProductCandidate[]) =>
      rankProducts(criteria, items, weights).map((r) => r.item.id);
    expect(
      order([product({ id: "a", ...base }), product({ id: "b", ...base, featured: true })]),
    ).toEqual(["b", "a"]);
    expect(
      order([product({ id: "a", ...base, rating: 4 }), product({ id: "b", ...base, rating: 4.8 })]),
    ).toEqual(["b", "a"]);
    expect(
      order([
        product({ id: "a", ...base, rating: 4, reviewCount: 2 }),
        product({ id: "b", ...base, rating: 4, reviewCount: 9 }),
      ]),
    ).toEqual(["b", "a"]);
    expect(
      order([product({ id: "a", ...base, stock: 2 }), product({ id: "b", ...base, stock: 20 })]),
    ).toEqual(["b", "a"]);
    expect(
      order([
        product({ id: "z", name: "Zambila", ...base }),
        product({ id: "y", name: "Ălbăstrea", ...base }),
      ]),
    ).toEqual(["y", "z"]);
  });

  it("excludes inactive, out-of-stock, excluded and purchased products", () => {
    const criteria = { signals: [sig("need", "seara", 3)] };
    const items = [
      product({ ...lavender, id: "inactive", active: false }),
      product({ ...lavender, id: "sold-out", stock: 0 }),
      product({ ...lavender, id: "excluded" }),
      product({ ...lavender, id: "bought" }),
      lavender,
    ];
    const ranked = rankProducts(
      { ...criteria, excludeIds: ["excluded"], context: { purchasedIds: ["bought"] } },
      items,
      weights,
    );
    expect(ranked.map((r) => r.item.id)).toEqual(["lavender"]);
  });

  it("drops products with no positive match or a non-positive total", () => {
    const criteria = { signals: [sig("productType", "DIFFUSER", -6), sig("need", "casa", 1)] };
    expect(rankProducts(criteria, [diffuser], weights)).toEqual([]);
    expect(
      rankProducts(
        { signals: [sig("need", "casa", 1)], context: { wishlistIds: ["lemon"] } },
        [lemon],
        weights,
      ),
    ).toEqual([]);
  });

  it("penalises products above the budget", () => {
    const criteria = {
      signals: [sig("need", "seara", 2)],
      maxPrice: 6000,
      budgetLabel: "Până în 60 lei",
    };
    const ranked = rankProducts(criteria, [blend, lavender], weights);
    expect(ranked.map((r) => r.item.id)).toEqual(["lavender", "blend"]);
    expect(ranked[1]!.contributions.at(-1)).toMatchObject({ source: "budget", points: -6 });
  });

  it("adds consented context affinities", () => {
    const criteria = { signals: [sig("need", "seara", 1)], context: { wishlistIds: ["blend"] } };
    const ranked = rankProducts(criteria, [lavender, blend], weights);
    expect(ranked[0]!.item.id).toBe("blend");
    expect(ranked[0]!.explanation).toContain("produsele tale favorite");
  });

  it("respects the limit", () => {
    expect(
      rankProducts({ signals: [sig("need", "seara", 1)] }, all, weights, { limit: 1 }),
    ).toHaveLength(1);
  });
});

describe("explanations", () => {
  it("names the top three choices in order of contribution", () => {
    const [top] = rankProducts(
      {
        signals: [
          sig("need", "relaxare", 3, "Relaxare"),
          sig("need", "seara", 2, "Seară"),
          sig("aroma", "floral", 1, "Floral"),
          sig("productType", "INDIVIDUAL_OIL", 0.5, "Ulei individual"),
        ],
      },
      [lavender],
      weights,
    );
    expect(top!.explanation).toBe("Recomandat pentru că ai ales: Relaxare + Seară + Floral.");
  });

  it("never mentions negative contributions and falls back gracefully", () => {
    expect(explain([{ label: "Buget", points: -6, source: "budget" }])).toBe(
      "Recomandat pentru tine.",
    );
    expect(
      explain([
        { label: "Floral", points: 2, source: "choice" },
        { label: "produsele tale favorite", points: 1, source: "context" },
      ]),
    ).toBe("Recomandat pentru că ai ales: Floral. Se potrivește și cu produsele tale favorite.");
  });
});

describe("criteria builders", () => {
  const answer = (o: Partial<AnswerConfig> & { id: string }): AnswerConfig => ({
    text: o.id,
    maxPrice: null,
    needs: [],
    aromas: [],
    tags: [],
    productTypes: [],
    ...o,
  });

  it("merges repeated signals from several answers and keeps the tightest budget", () => {
    const criteria = criteriaFromAnswers([
      answer({ id: "a", needs: [{ key: "seara", label: "Seară", weight: 3 }], maxPrice: 15000 }),
      answer({
        id: "b",
        text: "Până în 60 lei",
        needs: [{ key: "seara", label: "Seară", weight: 2 }],
        maxPrice: 6000,
      }),
      answer({ id: "c", productTypes: [{ type: "DIFFUSER", label: "Difuzor", weight: -6 }] }),
    ]);
    expect(criteria.signals).toEqual([
      { kind: "need", key: "seara", label: "Seară", weight: 5 },
      { kind: "productType", key: "DIFFUSER", label: "Difuzor", weight: -6 },
    ]);
    expect(criteria).toMatchObject({ maxPrice: 6000, budgetLabel: "Până în 60 lei" });
  });

  it("drops signals whose weights cancel out", () => {
    expect(mergeSignals([sig("tag", "x", 2), sig("tag", "x", -2)])).toEqual([]);
  });

  it("builds criteria from selected needs", () => {
    expect(criteriaFromNeeds([{ key: "relaxare", label: "Relaxare" }], 3).signals).toEqual([
      { kind: "need", key: "relaxare", label: "Relaxare", weight: 3 },
    ]);
  });
});

describe("rankProfiles (routines/articles hook)", () => {
  it("ranks any taxonomy profile with the same scoring", () => {
    const routines = [
      {
        id: "r1",
        title: "Ritual de seară",
        needs: [{ key: "seara", relevance: 1 }],
        aromas: [],
        tags: [],
      },
      {
        id: "r2",
        title: "Rutina de dimineață",
        needs: [{ key: "energie", relevance: 1 }],
        aromas: [],
        tags: [],
      },
    ];
    const ranked = rankProfiles(
      criteriaFromNeeds([{ key: "seara", label: "Seară" }], 3),
      routines,
      weights,
    );
    expect(ranked.map((r) => r.item.id)).toEqual(["r1"]);
    expect(ranked[0]!.explanation).toBe("Recomandat pentru că ai ales: Seară.");
  });
});
