import { describe, expect, it } from "vitest";

import { mergeWishlistIds } from "../wishlist/merge";

import { MAX_QUANTITY_PER_LINE } from "./calculate";
import { mergeCartItems } from "./merge";

describe("mergeCartItems", () => {
  it("sums quantities of the same product and keeps the rest", () => {
    expect(
      mergeCartItems(
        [
          { productId: "a", quantity: 1 },
          { productId: "b", quantity: 2 },
        ],
        [
          { productId: "a", quantity: 2 },
          { productId: "c", quantity: 1 },
        ],
      ),
    ).toEqual([
      { productId: "a", quantity: 3 },
      { productId: "b", quantity: 2 },
      { productId: "c", quantity: 1 },
    ]);
  });

  it("caps at the per-line maximum and drops empty lines", () => {
    expect(
      mergeCartItems(
        [{ productId: "a", quantity: 90 }],
        [
          { productId: "a", quantity: 20 },
          { productId: "b", quantity: 0 },
        ],
      ),
    ).toEqual([{ productId: "a", quantity: MAX_QUANTITY_PER_LINE }]);
  });

  it("handles empty sides", () => {
    expect(mergeCartItems([], [{ productId: "a", quantity: 1 }])).toEqual([
      { productId: "a", quantity: 1 },
    ]);
    expect(mergeCartItems([], [])).toEqual([]);
  });
});

describe("mergeWishlistIds", () => {
  it("unions without duplicates, account order first", () => {
    expect(mergeWishlistIds(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("caps the list", () => {
    expect(mergeWishlistIds(["a"], ["b", "c"], 2)).toEqual(["a", "b"]);
  });
});
