import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { storeImage, type StoredImage } from "@/lib/storage";
import type { ReviewInput } from "@/validation/review";
import { REVIEW_IMAGE_MAX_BYTES } from "@/validation/review";

import { reviewerName } from "../home/select";

import { reviewEligibility, summarizeRatings, type RatingSummary } from "./rules";

type Tx = Prisma.TransactionClient;

export class ReviewError extends Error {}

export async function getReviewEligibility(userId: string | null, productId: string) {
  if (!userId) return reviewEligibility({ signedIn: false, purchases: [], existing: null });
  const [items, existing] = await Promise.all([
    db.orderItem.findMany({
      where: { productId, order: { userId } },
      select: { id: true, order: { select: { status: true, placedAt: true } } },
    }),
    db.review.findUnique({
      where: { productId_userId: { productId, userId } },
      select: { status: true, rejectionReason: true },
    }),
  ]);
  return reviewEligibility({
    signedIn: true,
    purchases: items.map((i) => ({
      orderItemId: i.id,
      orderStatus: i.order.status,
      placedAt: i.order.placedAt,
    })),
    existing,
  });
}

/**
 * Creates (or rewrites a rejected) review as PENDING. Only verified purchases:
 * eligibility is re-checked here, never trusted from the form.
 */
export async function submitReview(userId: string, input: ReviewInput, image?: Blob | null) {
  const eligibility = await getReviewEligibility(userId, input.productId);
  if (!eligibility.canReview) throw new ReviewError(eligibility.message);

  let stored: StoredImage | null = null;
  if (image && image.size > 0)
    stored = await storeImage(image, {
      folder: "reviews",
      maxBytes: REVIEW_IMAGE_MAX_BYTES,
      maxDimension: 1600,
      formats: ["jpeg", "png", "webp"],
    });

  return db.$transaction(async (tx) => {
    const media = stored
      ? await tx.mediaAsset.create({
          data: {
            storageKey: stored.key,
            url: stored.url,
            mimeType: stored.mimeType,
            width: stored.width,
            height: stored.height,
            sizeBytes: stored.sizeBytes,
            createdById: userId,
          },
        })
      : null;
    const data = {
      rating: input.rating,
      title: input.title ?? null,
      body: input.body,
      orderItemId: eligibility.orderItemId,
      status: "PENDING" as const,
      imageId: media?.id ?? null,
      moderatedAt: null,
      moderatedById: null,
      rejectionReason: null,
    };
    return tx.review.upsert({
      where: { productId_userId: { productId: input.productId, userId } },
      create: { ...data, productId: input.productId, userId },
      update: data,
      select: { id: true, status: true },
    });
  });
}

/** Keeps the documented cache (Product.rating / reviewCount) equal to the approved reviews. */
export async function recomputeProductRating(productId: string, tx: Tx = db) {
  const approved = await tx.review.findMany({
    where: { productId, status: "APPROVED" },
    select: { rating: true },
  });
  const summary = summarizeRatings(approved.map((r) => r.rating));
  await tx.product.update({
    where: { id: productId },
    data: { rating: summary.average, reviewCount: summary.count },
  });
  return summary;
}

/** Approve or reject a review (admin); the product's rating follows in the same transaction. */
export async function moderateReview(input: {
  reviewId: string;
  decision: "APPROVED" | "REJECTED";
  moderatorId: string;
  reason?: string | null;
}) {
  return db.$transaction(async (tx) => {
    const review = await tx.review.update({
      where: { id: input.reviewId },
      data: {
        status: input.decision,
        moderatedAt: new Date(),
        moderatedById: input.moderatorId,
        rejectionReason: input.decision === "REJECTED" ? (input.reason ?? null) : null,
      },
      select: { productId: true },
    });
    return recomputeProductRating(review.productId, tx);
  });
}

export type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  author: string;
  verified: boolean;
  createdAt: Date;
  image: { url: string; width: number | null; height: number | null } | null;
};

export async function getProductReviews(
  productId: string,
  take = 10,
): Promise<{ summary: RatingSummary; reviews: PublicReview[] }> {
  const [ratings, rows] = await Promise.all([
    db.review.findMany({ where: { productId, status: "APPROVED" }, select: { rating: true } }),
    db.review.findMany({
      where: { productId, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        rating: true,
        title: true,
        body: true,
        orderItemId: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
        image: { select: { url: true, width: true, height: true } },
      },
    }),
  ]);
  return {
    summary: summarizeRatings(ratings.map((r) => r.rating)),
    reviews: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      author: reviewerName(r.user.firstName, r.user.lastName),
      verified: r.orderItemId !== null,
      createdAt: r.createdAt,
      image: r.image,
    })),
  };
}
