import { describe, expect, it } from "vitest";

import { distributionPercentages, reviewEligibility, summarizeRatings } from "./rules";

const member = { signedIn: true, emailVerified: true };

describe("reviewEligibility", () => {
  it("requires a signed-in member", () => {
    expect(
      reviewEligibility({ signedIn: false, emailVerified: false, existing: null }),
    ).toMatchObject({ canReview: false, reason: "signed-out" });
  });

  it("requires a confirmed email address", () => {
    expect(
      reviewEligibility({ signedIn: true, emailVerified: false, existing: null }),
    ).toMatchObject({ canReview: false, reason: "email-unverified" });
    expect(reviewEligibility({ ...member, existing: null })).toEqual({
      canReview: true,
      existing: null,
    });
  });

  it("allows one review per product, but a rejected one can be rewritten", () => {
    expect(reviewEligibility({ ...member, existing: { status: "PENDING" } })).toMatchObject({
      canReview: false,
      reason: "already-reviewed",
    });
    expect(reviewEligibility({ ...member, existing: { status: "APPROVED" } })).toMatchObject({
      canReview: false,
      reason: "already-reviewed",
    });
    expect(reviewEligibility({ ...member, existing: { status: "REJECTED" } })).toMatchObject({
      canReview: true,
    });
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
