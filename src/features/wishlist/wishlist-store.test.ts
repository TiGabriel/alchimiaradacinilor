import { describe, expect, it } from "vitest";

import { parseWishlist, toggleId } from "./wishlist-store";

describe("parseWishlist", () => {
  it("accepts a JSON array of ids", () => {
    expect(parseWishlist('["a","b","a"]')).toEqual(["a", "b"]);
  });

  it("rejects malformed data", () => {
    expect(parseWishlist(null)).toEqual([]);
    expect(parseWishlist("not json")).toEqual([]);
    expect(parseWishlist('{"a":1}')).toEqual([]);
    expect(parseWishlist('[1, null, "ok"]')).toEqual(["ok"]);
  });
});

describe("toggleId", () => {
  it("adds newest first and removes existing ids", () => {
    expect(toggleId(["a"], "b")).toEqual(["b", "a"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });
});
