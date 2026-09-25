import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { addCartItem, loadCartView, mergeGuestCartIntoUser } from "@/services/cart/cart";
import { mergeLocalWishlistIntoUser, toggleUserWishlist } from "@/services/wishlist/wishlist";

import { makeProduct, makeUser } from "./helpers";

describe("merge on login", () => {
  it("moves the guest cart into the account, summing quantities", async () => {
    const user = await makeUser();
    const a = await makeProduct({ slug: "a" });
    const b = await makeProduct({ slug: "b" });
    await addCartItem({ userId: user.id, token: null }, a.id, 1);
    const guest = await addCartItem({ userId: null, token: null }, a.id, 2);
    await addCartItem({ userId: null, token: guest.token }, b.id, 1);

    await mergeGuestCartIntoUser(guest.token!, user.id);

    const view = await loadCartView({ userId: user.id, token: null });
    expect(view.lines.map((l) => [l.slug, l.quantity]).sort()).toEqual([
      ["a", 3],
      ["b", 1],
    ]);
    expect(await db.cart.count({ where: { token: guest.token } })).toBe(0);
  });

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
