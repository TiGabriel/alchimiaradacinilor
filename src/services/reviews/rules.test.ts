import { describe, expect, it } from "vitest";

import { distributionPercentages, reviewEligibility, summarizeRatings } from "./rules";

const purchase = (orderStatus: "PENDING" | "SHIPPED" | "DELIVERED" | "CANCELLED", day = 1) => ({
  orderItemId: `item-${orderStatus}-${day}`,
  orderStatus,
  placedAt: new Date(2026, 8, day),
});

describe("reviewEligibility", () => {
  it("requires a signed-in customer", () => {
    expect(reviewEligibility({ signedIn: false, purchases: [], existing: null })).toMatchObject({
      canReview: false,
      reason: "signed-out",
    });
  });

  it("requires a purchase that has shipped", () => {
    expect(reviewEligibility({ signedIn: true, purchases: [], existing: null })).toMatchObject({
      reason: "not-purchased",
    });
    expect(
      reviewEligibility({ signedIn: true, purchases: [purchase("PENDING")], existing: null }),
    ).toMatchObject({ reason: "not-received" });
    expect(
      reviewEligibility({ signedIn: true, purchases: [purchase("CANCELLED")], existing: null }),
    ).toMatchObject({ reason: "not-received" });
  });

  it("links the review to the most recent received purchase", () => {
    expect(
      reviewEligibility({
        signedIn: true,
        purchases: [purchase("DELIVERED", 2), purchase("SHIPPED", 9), purchase("PENDING", 20)],
        existing: null,
      }),
    ).toMatchObject({ canReview: true, orderItemId: "item-SHIPPED-9" });
  });

  it("allows one review per product, but a rejected one can be rewritten", () => {
    const purchases = [purchase("DELIVERED")];
    expect(
      reviewEligibility({ signedIn: true, purchases, existing: { status: "PENDING" } }),
    ).toMatchObject({ canReview: false, reason: "already-reviewed" });
    expect(
      reviewEligibility({ signedIn: true, purchases, existing: { status: "APPROVED" } }),
    ).toMatchObject({ canReview: false, reason: "already-reviewed" });
    expect(
      reviewEligibility({ signedIn: true, purchases, existing: { status: "REJECTED" } }),
    ).toMatchObject({ canReview: true });
  });
});

describe("summarizeRatings", () => {
  it("averages to one decimal and counts per star", () => {
    expect(summarizeRatings([5, 4, 4, 3])).toEqual({
      average: 4,
      count: 4,
      distribution: [0, 0, 1, 2, 1],
    });
    expect(summarizeRatings([5, 5, 4]).average).toBe(4.7);
  });

  it("handles no reviews and ignores invalid values", () => {
    expect(summarizeRatings([])).toEqual({
      average: null,
      count: 0,
      distribution: [0, 0, 0, 0, 0],
    });
    expect(summarizeRatings([0, 6, 2.5, 5]).count).toBe(1);
  });

  it("converts the distribution to percentages", () => {
    expect(distributionPercentages(summarizeRatings([5, 5, 5, 1]))).toEqual([25, 0, 0, 0, 75]);
    expect(distributionPercentages(summarizeRatings([]))).toEqual([0, 0, 0, 0, 0]);
  });
});
