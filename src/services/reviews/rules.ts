/** Review rules — pure and unit-tested. */
import type { ReviewStatus } from "@/generated/prisma/enums";

/**
 * Any signed-in member with a confirmed email may review a product. Purchases happen on the
 * doTERRA site, so the "verified purchase" badge is granted separately (docs/PIVOT_PLAN.md 4.6).
 */
export type ReviewEligibility =
  | { canReview: true; existing: { status: ReviewStatus } | null }
  | {
      canReview: false;
      reason: "signed-out" | "email-unverified" | "already-reviewed";
      message: string;
      existing: { status: ReviewStatus; rejectionReason?: string | null } | null;
    };

export function reviewEligibility(input: {
  signedIn: boolean;
  emailVerified: boolean;
  existing: { status: ReviewStatus; rejectionReason?: string | null } | null;
}): ReviewEligibility {
  if (!input.signedIn)
    return {
      canReview: false,
      reason: "signed-out",
      message:
        "Recenziile pot fi scrise de membrii comunității. Autentifică-te pentru a lăsa o recenzie.",
      existing: null,
    };
  if (input.existing?.status === "APPROVED" || input.existing?.status === "PENDING")
    return {
      canReview: false,
      reason: "already-reviewed",
      message:
        input.existing.status === "PENDING"
          ? "Mulțumim! Recenzia ta este în curs de verificare și va apărea după aprobare."
          : "Ai scris deja o recenzie pentru acest produs. Mulțumim!",
      existing: input.existing,
    };
  if (!input.emailVerified)
    return {
      canReview: false,
      reason: "email-unverified",
      message: "Confirmă-ți adresa de email pentru a putea scrie o recenzie.",
      existing: input.existing,
    };
  // A rejected review may be rewritten.
  return { canReview: true, existing: input.existing };
}

export type RatingSummary = {
  /** Average rounded to one decimal; null without reviews. */
  average: number | null;
  count: number;
  /** Number of reviews per star, index 0 = 1 star … index 4 = 5 stars. */
  distribution: [number, number, number, number, number];
};

export function summarizeRatings(ratings: number[]): RatingSummary {
  const distribution: RatingSummary["distribution"] = [0, 0, 0, 0, 0];
  let sum = 0;
  let count = 0;
  for (const r of ratings) {
    if (!Number.isInteger(r) || r < 1 || r > 5) continue;
    distribution[r - 1]! += 1;
    sum += r;
    count += 1;
  }
  return {
    average: count ? Math.round((sum / count) * 10) / 10 : null,
    count,
    distribution,
  };
}

/** Share of each star bar, 0–100, for the distribution chart. */
export function distributionPercentages(summary: RatingSummary): number[] {
  return summary.distribution.map((n) =>
    summary.count ? Math.round((n / summary.count) * 100) : 0,
  );
}
