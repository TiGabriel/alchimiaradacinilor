import { describe, expect, it } from "vitest";

import { reviewCountLabel } from "./rating-stars";

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
