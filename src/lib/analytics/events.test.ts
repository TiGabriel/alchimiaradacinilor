import { describe, expect, it } from "vitest";

import { cleanPath, sanitizeProps } from "./events";
import { analyticsPayloadSchema } from "./schema";

describe("analytics events", () => {
  it("accepts only known events with small flat properties", () => {
    const ok = analyticsPayloadSchema.safeParse({
      name: "add_to_cart",
      anonymousId: "analytics_1234",
      path: "/produs/lavender",
      props: { productId: "p1", quantity: 2 },
    });
    expect(ok.success).toBe(true);
    expect(
      analyticsPayloadSchema.safeParse({ name: "page_hack", anonymousId: "analytics_1234" })
        .success,
    ).toBe(false);
    expect(
      analyticsPayloadSchema.safeParse({
        name: "search",
        anonymousId: "analytics_1234",
        props: { nested: { a: 1 } },
      }).success,
    ).toBe(false);
  });

  it("drops personal-looking keys and non-primitive values", () => {
    expect(
      sanitizeProps({ email: "a@b.ro", firstName: "Ana", productId: "p1", list: [1], ok: true }),
    ).toEqual({ productId: "p1", ok: true });
    expect(sanitizeProps({ q: "x".repeat(500) }).q).toHaveLength(120);
  });

  it("strips query strings from paths", () => {
    expect(cleanPath("/newsletter/confirmare?token=secret")).toBe("/newsletter/confirmare");
    expect(cleanPath("/cautare?q=lavanda#top")).toBe("/cautare");
  });
});
