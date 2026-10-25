import { describe, expect, it } from "vitest";

import { linkedFirst, productHref } from "./product-types";

describe("product URLs", () => {
  it("builds product URLs", () => {
    expect(productHref({ slug: "lemon" })).toBe("/produs/lemon");
  });
});

describe("linkedFirst", () => {
  it("moves products with a doTERRA link to the front and keeps the order within each group", () => {
    const items = [
      { id: "a", link: false },
      { id: "b", link: true },
      { id: "c", link: false },
      { id: "d", link: true },
    ];
    expect(linkedFirst(items, (i) => i.link).map((i) => i.id)).toEqual(["b", "d", "a", "c"]);
    expect(items.map((i) => i.id)).toEqual(["a", "b", "c", "d"]);
  });
});
