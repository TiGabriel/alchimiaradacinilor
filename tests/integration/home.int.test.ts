import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { getHomeEssentials, getHomeReviews, getPersonalRow } from "@/services/home/home";

import { makeProduct, makeUser } from "./helpers";

describe("homepage data", () => {
  it("shows only approved, well-rated reviews with a privacy-safe author name", async () => {
    const product = await makeProduct({ slug: "lavender" });
    const ana = await makeUser({ firstName: "Ana", lastName: "Pop", email: "ana@example.ro" });
    const ion = await makeUser({ firstName: "Ion", lastName: "Rusu", email: "ion@example.ro" });
    const eva = await makeUser({ firstName: "Eva", lastName: "Stan", email: "eva@example.ro" });
    const body = "O aromă caldă, exact ce căutam pentru seară.";
    await db.review.createMany({
      data: [
        { productId: product.id, userId: ana.id, rating: 5, body, status: "APPROVED" },
        { productId: product.id, userId: ion.id, rating: 5, body, status: "PENDING" },
        { productId: product.id, userId: eva.id, rating: 2, body, status: "APPROVED" },
      ],
    });

    const reviews = await getHomeReviews(3);
    expect(reviews).toHaveLength(1);
    expect(reviews[0]).toMatchObject({ author: "Ana P.", verified: false, rating: 5 });
    expect(reviews[0]!.product.slug).toBe("lavender");
  });

  it("returns no reviews rather than inventing any", async () => {
    expect(await getHomeReviews(3)).toEqual([]);
  });

  it("resolves the configured essentials and hides the section when too few exist", async () => {
    expect(await getHomeEssentials()).toEqual([]);
    for (const slug of ["lavender", "lemon", "peppermint"]) await makeProduct({ slug });
    const essentials = await getHomeEssentials();
    expect(essentials.map((e) => [e.position, e.product.slug])).toEqual([
      [1, "lavender"],
      [2, "lemon"],
      [3, "peppermint"],
    ]);
  });

  it("builds the personal row from the latest quiz, skipping sold-out products", async () => {
    const user = await makeUser();
    const inStock = await makeProduct({ slug: "in-stock" });
    const soldOut = await makeProduct({ slug: "sold-out", stock: 0 });
    const quiz = await db.quiz.create({ data: { slug: "q", title: "Quiz" } });
    expect(await getPersonalRow(user.id)).toBeNull();

    await db.quizResult.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        products: {
          create: [
            {
              productId: soldOut.id,
              score: 900,
              rank: 1,
              reason: "Recomandat pentru că ai ales: Seară.",
            },
            {
              productId: inStock.id,
              score: 800,
              rank: 2,
              reason: "Recomandat pentru că ai ales: Floral.",
            },
          ],
        },
      },
    });
    const row = await getPersonalRow(user.id);
    expect(row?.source).toBe("quiz");
    expect(row?.items.map((i) => [i.product.slug, i.reason])).toEqual([
      ["in-stock", "Recomandat pentru că ai ales: Floral."],
    ]);
  });
});
