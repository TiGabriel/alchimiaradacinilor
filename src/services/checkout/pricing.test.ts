import { describe, expect, it } from "vitest";

import type { ShippingMethod } from "@/validation/settings";

import type { CartLineInput } from "../cart/calculate";

import { includedVat, priceOrder, resolveShippingMethod, shippingRulesFor } from "./pricing";

const courier: ShippingMethod = {
  code: "curier",
  name: "Curier",
  price: 1999,
  freeShippingEligible: true,
  active: true,
};
const express: ShippingMethod = {
  code: "express",
  name: "Express",
  price: 3500,
  freeShippingEligible: false,
  active: true,
};
const pickup: ShippingMethod = { ...courier, code: "ridicare", price: 0, active: false };
const shipping = { freeShippingThreshold: 25000, methods: [pickup, courier, express] };

const line = (o: Partial<CartLineInput> & { productId: string }): CartLineInput => ({
  quantity: 1,
  unitPrice: 5000,
  compareAtPrice: null,
  stock: 10,
  available: true,
  ...o,
});

describe("shipping methods", () => {
  it("defaults to the first active method and rejects unknown or inactive codes", () => {
    expect(resolveShippingMethod(shipping)?.code).toBe("curier");
    expect(resolveShippingMethod(shipping, "express")?.code).toBe("express");
    expect(resolveShippingMethod(shipping, "ridicare")).toBeNull();
    expect(resolveShippingMethod(shipping, "nope")).toBeNull();
  });

  it("applies the free-shipping threshold only to eligible methods", () => {
    expect(shippingRulesFor(shipping, courier)).toEqual({
      flatFee: 1999,
      freeShippingThreshold: 25000,
    });
    expect(shippingRulesFor(shipping, express).freeShippingThreshold).toBeNull();
  });
});

describe("includedVat", () => {
  it("extracts VAT from a VAT-inclusive amount", () => {
    expect(includedVat(12100, 21)).toBe(2100);
    expect(includedVat(1000, 0)).toBe(0);
    expect(includedVat(0, 21)).toBe(0);
  });
});

describe("priceOrder", () => {
  const lines = [line({ productId: "a", quantity: 2 }), line({ productId: "b", unitPrice: 7900 })];

  it("adds the method's fee below the threshold", () => {
    const priced = priceOrder(lines, { shipping, method: courier, vatRatePercent: 21 });
    expect(priced).toMatchObject({ subtotal: 17900, shipping: 1999, total: 19899 });
    expect(priced.tax).toBe(includedVat(19899, 21));
  });

  it("ships free above the threshold, but not with a non-eligible method", () => {
    const big = [line({ productId: "a", quantity: 6 })];
    expect(priceOrder(big, { shipping, method: courier, vatRatePercent: 21 }).shipping).toBe(0);
    expect(priceOrder(big, { shipping, method: express, vatRatePercent: 21 }).shipping).toBe(3500);
  });

  it("applies a coupon discount before the free-shipping threshold", () => {
    const big = [line({ productId: "a", quantity: 5 })]; // 25 000 → threshold reached…
    const priced = priceOrder(big, {
      shipping,
      method: courier,
      vatRatePercent: 21,
      coupon: {
        label: "Cod X",
        check: { ok: true, discount: 2500, freeShipping: false, eligibleSubtotal: 25000 },
      },
    });
    // …but the discounted subtotal (22 500) is below it, so shipping is charged.
    expect(priced).toMatchObject({ discount: 2500, shipping: 1999, total: 24499 });
    expect(priced.discounts).toEqual([{ label: "Cod X", amount: 2500 }]);
    expect(priced.couponApplied).toBe(true);
  });

  it("honours free-shipping coupons only for eligible methods", () => {
    const coupon = {
      label: "Cod LIVRARE",
      check: { ok: true as const, discount: 0, freeShipping: true, eligibleSubtotal: 17900 },
    };
    expect(
      priceOrder(lines, { shipping, method: courier, vatRatePercent: 21, coupon }),
    ).toMatchObject({ shipping: 0, couponApplied: true });
    expect(
      priceOrder(lines, { shipping, method: express, vatRatePercent: 21, coupon }),
    ).toMatchObject({ shipping: 3500, couponApplied: false });
  });

  it("ignores rejected coupons", () => {
    const priced = priceOrder(lines, {
      shipping,
      method: courier,
      vatRatePercent: 21,
      coupon: { label: "Cod X", check: { ok: false, reason: "expired", message: "x" } },
    });
    expect(priced).toMatchObject({ discount: 0, couponApplied: false });
  });

  it("prices only what can be bought (stock-clamped quantities)", () => {
    const priced = priceOrder([line({ productId: "a", quantity: 5, stock: 2 })], {
      shipping,
      method: courier,
      vatRatePercent: 21,
    });
    expect(priced).toMatchObject({ subtotal: 10000, hasIssues: true });
  });
});
