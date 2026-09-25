import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { storage } from "@/lib/storage";
import { changeOrderStatus } from "@/services/orders/orders";
import {
  getProductReviews,
  getReviewEligibility,
  moderateReview,
  ReviewError,
  submitReview,
} from "@/services/reviews/reviews";

import { makeProduct, makeVerifiedUser, placeTestOrder } from "./helpers";

const body = "O aromă florală, caldă, perfectă pentru serile liniștite.";

async function buyerOf(productId: string, email: string, ship = true) {
  const user = await makeVerifiedUser({ email, firstName: "Ioana", lastName: "Mureșan" });
  const order = await placeTestOrder(user.id, [productId]);
  if (ship)
    for (const to of ["CONFIRMED", "SHIPPED"] as const)
      await changeOrderStatus({ orderId: order.id, to, actorId: null });
  return user;
}

describe("verified-purchase reviews", () => {
  it("only customers whose order has shipped can review", async () => {
    const product = await makeProduct({ slug: "lavender" });
    const stranger = await makeVerifiedUser({ email: "x@example.ro" });
    expect(await getReviewEligibility(null, product.id)).toMatchObject({ reason: "signed-out" });
    expect(await getReviewEligibility(stranger.id, product.id)).toMatchObject({
      reason: "not-purchased",
    });
    await expect(
      submitReview(stranger.id, { productId: product.id, rating: 5, body }),
    ).rejects.toBeInstanceOf(ReviewError);

    const waiting = await buyerOf(product.id, "w@example.ro", false);
    expect(await getReviewEligibility(waiting.id, product.id)).toMatchObject({
      reason: "not-received",
    });

    const buyer = await buyerOf(product.id, "b@example.ro");
    expect(await getReviewEligibility(buyer.id, product.id)).toMatchObject({ canReview: true });
  });

  it("moderation publishes reviews and keeps the product rating in sync", async () => {
    const product = await makeProduct();
    const a = await buyerOf(product.id, "a@example.ro");
    const b = await buyerOf(product.id, "b@example.ro");
    const ra = await submitReview(a.id, {
      productId: product.id,
      rating: 5,
      title: "Minunat",
      body,
    });
    const rb = await submitReview(b.id, { productId: product.id, rating: 3, body });
    expect(ra.status).toBe("PENDING");
    // One review per product and customer.
    await expect(submitReview(a.id, { productId: product.id, rating: 4, body })).rejects.toThrow(
      "în curs de verificare",
    );

    expect((await getProductReviews(product.id)).reviews).toEqual([]);
    const admin = await makeVerifiedUser({ email: "admin@example.ro" });
    await moderateReview({ reviewId: ra.id, decision: "APPROVED", moderatorId: admin.id });
    await moderateReview({ reviewId: rb.id, decision: "APPROVED", moderatorId: admin.id });

    let cached = await db.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(cached).toMatchObject({ rating: 4, reviewCount: 2 });
    const { summary, reviews } = await getProductReviews(product.id);
    expect(summary).toEqual({ average: 4, count: 2, distribution: [0, 0, 1, 0, 1] });
    expect(reviews[0]).toMatchObject({ author: "Ioana M.", verified: true });

    await moderateReview({
      reviewId: rb.id,
      decision: "REJECTED",
      moderatorId: admin.id,
      reason: "Conține date personale.",
    });
    cached = await db.product.findUniqueOrThrow({ where: { id: product.id } });
    expect(cached).toMatchObject({ rating: 5, reviewCount: 1 });

    // A rejected review can be rewritten; it goes back to moderation.
    expect(await getReviewEligibility(b.id, product.id)).toMatchObject({ canReview: true });
    const rewritten = await submitReview(b.id, { productId: product.id, rating: 4, body });
    expect(rewritten).toMatchObject({ id: rb.id, status: "PENDING" });
  });

  it("stores an optional photo without its metadata", async () => {
    const product = await makeProduct();
    const buyer = await buyerOf(product.id, "p@example.ro");
    const photo = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#c9b79c" },
    })
      .jpeg()
      .withExif({ IFD0: { Artist: "Ioana" } })
      .toBuffer();
    const review = await submitReview(
      buyer.id,
      { productId: product.id, rating: 5, body },
      new Blob([new Uint8Array(photo)]),
    );
    const saved = await db.review.findUniqueOrThrow({
      where: { id: review.id },
      include: { image: true },
    });
    expect(saved.image).toMatchObject({ mimeType: "image/webp", width: 800 });
    await storage().delete(saved.image!.storageKey);
  });
});
