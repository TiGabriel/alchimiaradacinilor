import "server-only";

import type { ReviewStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

import { assertCan, type Actor } from "../auth/permissions";
import { moderateReview } from "../reviews/reviews";

export async function listReviewsForModeration(actor: Actor, status: ReviewStatus) {
  assertCan(actor, "content:edit");
  const [reviews, counts] = await Promise.all([
    db.review.findMany({
      where: { status },
      orderBy: { createdAt: status === "PENDING" ? "asc" : "desc" },
      take: 100,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        createdAt: true,
        rejectionReason: true,
        orderItemId: true,
        user: { select: { firstName: true, lastName: true, email: true } },
        product: { select: { name: true, slug: true } },
        image: { select: { url: true } },
      },
    }),
    db.review.groupBy({ by: ["status"], _count: true }),
  ]);
  return {
    reviews,
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])) as Partial<
      Record<ReviewStatus, number>
    >,
  };
}

export async function adminModerateReview(
  actor: Actor,
  input: { reviewId: string; decision: "APPROVED" | "REJECTED"; reason?: string | null },
) {
  assertCan(actor, "content:edit");
  return moderateReview({ ...input, moderatorId: actor.id });
}
