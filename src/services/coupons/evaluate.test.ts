import { describe, expect, it } from "vitest";

import {
  couponLabel,
  evaluateCoupon,
  normalizeCouponCode,
  type CouponContext,
  type CouponDefinition,
} from "./evaluate";

const now = new Date("2026-09-25T10:00:00Z");

const coupon = (o: Partial<CouponDefinition> = {}): CouponDefinition => ({
  id: "c1",
  code: "PRIMAVARA",
  type: "PERCENTAGE",
  value: 10,
  minSubtotal: null,
  maxDiscount: null,
  startsAt: null,
  endsAt: null,
  usageLimit: null,
  perCustomerLimit: null,
  active: true,
  productIds: [],
  categoryIds: [],
  ...o,
});

const ctx = (o: Partial<CouponContext> = {}): CouponContext => ({
  now,
  lines: [
    { productId: "oil", categoryIds: ["uleiuri"], lineTotal: 10000 },
    { productId: "diffuser", categoryIds: ["difuzoare"], lineTotal: 20000 },
  ],
  subtotal: 30000,
  usage: { total: 0, customer: 0 },
  ...o,
});

const discountOf = (c: CouponDefinition, context = ctx()) => {
  const result = evaluateCoupon(c, context);
  if (!result.ok) throw new Error(result.message);
  return result;
};

describe("normalizeCouponCode", () => {
  it("is case-insensitive and ignores spaces", () => {
    expect(normalizeCouponCode(" primavara 10 ")).toBe("PRIMAVARA10");
  });
});

describe("evaluateCoupon — amounts", () => {
  it("applies a percentage to the whole cart", () => {
    expect(discountOf(coupon()).discount).toBe(3000);
  });

  it("caps a percentage with maxDiscount", () => {
    expect(discountOf(coupon({ maxDiscount: 1500 })).discount).toBe(1500);
  });

  it("applies a fixed amount, never more than the eligible subtotal", () => {
    expect(discountOf(coupon({ type: "FIXED_AMOUNT", value: 2500 })).discount).toBe(2500);
    expect(discountOf(coupon({ type: "FIXED_AMOUNT", value: 99999 })).discount).toBe(30000);
  });

  it("free shipping gives no amount but the free-shipping flag", () => {
    expect(discountOf(coupon({ type: "FREE_SHIPPING", value: 0 }))).toMatchObject({
      discount: 0,
      freeShipping: true,
    });
  });

  it("restricts to products or categories (categories include ancestors)", () => {
    expect(discountOf(coupon({ productIds: ["diffuser"] })).discount).toBe(2000);
    expect(discountOf(coupon({ categoryIds: ["uleiuri"] }))).toMatchObject({
      discount: 1000,
      eligibleSubtotal: 10000,
    });
    const fixed = coupon({ type: "FIXED_AMOUNT", value: 15000, categoryIds: ["uleiuri"] });
    expect(discountOf(fixed).discount).toBe(10000);
  });
});

describe("evaluateCoupon — rejections", () => {
  const reason = (c: CouponDefinition | null, context = ctx()) => {
    const result = evaluateCoupon(c, context);
    return result.ok ? "ok" : result.reason;
  };

  it("rejects unknown or inactive codes", () => {
    expect(reason(null)).toBe("not-found");
    expect(reason(coupon({ active: false }))).toBe("not-found");
  });

  it("checks the validity window", () => {
    expect(reason(coupon({ startsAt: new Date("2026-10-01T00:00:00Z") }))).toBe("not-started");
    expect(reason(coupon({ endsAt: new Date("2026-09-24T23:59:59Z") }))).toBe("expired");
    expect(
      reason(
        coupon({
          startsAt: new Date("2026-09-01T00:00:00Z"),
          endsAt: new Date("2026-09-30T00:00:00Z"),
        }),
      ),
    ).toBe("ok");
  });

  it("enforces the total and per-customer limits", () => {
    expect(reason(coupon({ usageLimit: 5 }), ctx({ usage: { total: 5, customer: 0 } }))).toBe(
      "exhausted",
    );
    expect(reason(coupon({ usageLimit: 5 }), ctx({ usage: { total: 4, customer: 0 } }))).toBe("ok");
    expect(reason(coupon({ perCustomerLimit: 1 }), ctx({ usage: { total: 1, customer: 1 } }))).toBe(
      "customer-limit",
    );
    // Guests are checked again at checkout, once the customer is known.
    expect(
      reason(coupon({ perCustomerLimit: 1 }), ctx({ usage: { total: 1, customer: null } })),
    ).toBe("ok");
  });

  it("requires the minimum order value on the whole cart", () => {
    const result = evaluateCoupon(coupon({ minSubtotal: 35000 }), ctx());
    expect(result).toMatchObject({ ok: false, reason: "min-subtotal" });
    expect(!result.ok && result.message).toContain("50,00");
    expect(reason(coupon({ minSubtotal: 30000 }))).toBe("ok");
  });

  it("rejects when no line qualifies or the cart is empty", () => {
    expect(reason(coupon({ productIds: ["other"] }))).toBe("not-applicable");
    expect(reason(coupon(), ctx({ lines: [], subtotal: 0 }))).toBe("empty-cart");
    expect(
      reason(coupon(), ctx({ lines: [{ productId: "oil", categoryIds: [], lineTotal: 0 }] })),
    ).toBe("empty-cart");
  });
});

describe("couponLabel", () => {
  it("describes the discount", () => {
    expect(couponLabel(coupon())).toBe("Cod PRIMAVARA (−10%)");
    expect(couponLabel(coupon({ type: "FIXED_AMOUNT", value: 2000 }))).toBe("Cod PRIMAVARA");
    expect(couponLabel(coupon({ type: "FREE_SHIPPING" }))).toBe("Cod PRIMAVARA (livrare gratuită)");
  });
});
