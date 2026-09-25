import { describe, expect, it } from "vitest";

import { clampQuantity } from "./quantity-selector";
import { reviewCountLabel } from "./rating-stars";

describe("clampQuantity", () => {
  it("keeps whole numbers within bounds", () => {
    expect(clampQuantity(3, 1, 5)).toBe(3);
    expect(clampQuantity(0, 1, 5)).toBe(1);
    expect(clampQuantity(9, 1, 5)).toBe(5);
    expect(clampQuantity(2.7, 1, 5)).toBe(2);
    expect(clampQuantity(40, 1, undefined)).toBe(40);
  });

  it("falls back to the minimum for invalid input", () => {
    expect(clampQuantity(Number.NaN, 1, 5)).toBe(1);
  });
});

describe("reviewCountLabel", () => {
  it("uses Romanian plural agreement", () => {
    expect(reviewCountLabel(1)).toBe("1 recenzie");
    expect(reviewCountLabel(3)).toBe("3 recenzii");
    expect(reviewCountLabel(19)).toBe("19 recenzii");
    expect(reviewCountLabel(20)).toBe("20 de recenzii");
    expect(reviewCountLabel(101)).toBe("101 recenzii");
    expect(reviewCountLabel(120)).toBe("120 de recenzii");
  });
});
