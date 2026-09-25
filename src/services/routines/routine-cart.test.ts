import { describe, expect, it } from "vitest";

import { describeRoutinePlan, planRoutineCart, type RoutineItem } from "./routine-cart";

const item = (o: Partial<RoutineItem> & { productId: string }): RoutineItem => ({
  name: o.productId,
  active: true,
  stock: 5,
  optional: false,
  ...o,
});

describe("planRoutineCart", () => {
  it("adds every in-stock product once and explains the rest", () => {
    const plan = planRoutineCart(
      [
        item({ productId: "lavender", name: "Lavender" }),
        item({ productId: "blend", name: "Amestec", stock: 0 }),
        item({ productId: "old", name: "Vechi", active: false }),
        item({ productId: "diffuser", name: "Difuzor", optional: true }),
        item({ productId: "lemon", name: "Lemon" }),
        item({ productId: "lavender", name: "Lavender" }),
      ],
      new Set(["lemon"]),
    );
    expect(plan.toAdd.map((a) => a.productId)).toEqual(["lavender", "diffuser"]);
    expect(plan.toAdd.every((a) => a.quantity === 1)).toBe(true);
    expect(plan.skipped).toEqual([
      { productId: "blend", name: "Amestec", reason: "out-of-stock" },
      { productId: "old", name: "Vechi", reason: "unavailable" },
      { productId: "lemon", name: "Lemon", reason: "already-in-cart" },
    ]);
  });

  it("handles an empty routine", () => {
    expect(planRoutineCart([], new Set())).toEqual({ toAdd: [], skipped: [] });
  });
});

describe("describeRoutinePlan", () => {
  it("tells the customer what was added and what was skipped", () => {
    expect(
      describeRoutinePlan(
        ["Lavender"],
        [
          { productId: "b", name: "Amestec", reason: "out-of-stock" },
          { productId: "l", name: "Lemon", reason: "already-in-cart" },
        ],
      ),
    ).toBe(
      "Am adăugat în coș: Lavender. Nu am putut adăuga: Amestec (nu mai este în stoc). Deja în coș: Lemon.",
    );
    expect(describeRoutinePlan([], [])).toBe("Nu a fost nimic de adăugat.");
  });
});
