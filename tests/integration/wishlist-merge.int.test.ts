import { describe, expect, it } from "vitest";

import { mergeLocalWishlistIntoUser, toggleUserWishlist } from "@/services/wishlist/wishlist";

import { makeProduct, makeUser } from "./helpers";

describe("merge on login", () => {
  it("merges the browser wishlist, ignoring unknown products", async () => {
    const user = await makeUser();
    const a = await makeProduct({ slug: "a" });
    const b = await makeProduct({ slug: "b" });
    await toggleUserWishlist(user.id, a.id);
    const merged = await mergeLocalWishlistIntoUser(user.id, [
      b.id,
      a.id,
      "01900000-0000-7000-8000-000000000000",
    ]);
    expect(merged).toEqual([a.id, b.id]);
  });
});
