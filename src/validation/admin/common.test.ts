import { describe, expect, it } from "vitest";

import { seoSchema } from "./common";

describe("seoSchema", () => {
  it("defaults to an empty, indexable record", () => {
    expect(seoSchema.parse({})).toEqual({
      seoTitle: undefined,
      metaDescription: undefined,
      canonicalUrl: null,
      ogImageId: null,
      noIndex: false,
    });
  });

  it("accepts site paths and absolute http(s) canonicals", () => {
    expect(seoSchema.parse({ canonicalUrl: "/produs/lavanda" }).canonicalUrl).toBe(
      "/produs/lavanda",
    );
    expect(seoSchema.parse({ canonicalUrl: "https://exemplu.ro/x" }).canonicalUrl).toBe(
      "https://exemplu.ro/x",
    );
    expect(seoSchema.parse({ canonicalUrl: "" }).canonicalUrl).toBeNull();
  });

  it("rejects other canonicals, long texts and bad image ids", () => {
    expect(seoSchema.safeParse({ canonicalUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(seoSchema.safeParse({ canonicalUrl: "produs/fara-slash" }).success).toBe(false);
    expect(seoSchema.safeParse({ seoTitle: "x".repeat(71) }).success).toBe(false);
    expect(seoSchema.safeParse({ metaDescription: "x".repeat(161) }).success).toBe(false);
    expect(seoSchema.safeParse({ ogImageId: "nu-e-uuid" }).success).toBe(false);
  });
});
