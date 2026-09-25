import { describe, expect, it } from "vitest";

import { formatMoney } from "@/lib/money";

import {
  calculateCart,
  calculateLine,
  clampLineQuantity,
  fixedDiscount,
  freeShippingDiscount,
  MAX_QUANTITY_PER_LINE,
  percentageDiscount,
  type CartLineInput,
  type ShippingRules,
} from "./calculate";

const line = (o: Partial<CartLineInput> & { productId: string }): CartLineInput => ({
  quantity: 1,
  unitPrice: 4900,
  compareAtPrice: null,
  stock: 10,
  available: true,
  ...o,
});

const shipping: ShippingRules = { flatFee: 1999, freeShippingThreshold: 25000 };
const nbsp = (s: string) => s.replace(/\s/g, " ");

describe("quantities and stock", () => {
  it("multiplies quantity by unit price", () => {
    const cart = calculateCart([line({ productId: "a", quantity: 3 })], shipping);
    expect(cart.subtotal).toBe(14700);
    expect(cart.itemCount).toBe(3);
    expect(cart.lines[0]).toMatchObject({ quantity: 3, lineTotal: 14700, issue: null });
  });

  it("reduces quantities above stock and flags them", () => {
    const calculated = calculateLine(line({ productId: "a", quantity: 5, stock: 2 }));
    expect(calculated).toMatchObject({
      quantity: 2,
      requestedQuantity: 5,
      lineTotal: 9800,
      issue: "quantity-reduced",
    });
  });

  it("excludes out-of-stock and unavailable lines from totals but keeps them visible", () => {
    const cart = calculateCart(
      [
        line({ productId: "a", quantity: 2 }),
        line({ productId: "b", quantity: 1, stock: 0 }),
        line({ productId: "c", quantity: 1, available: false }),
      ],
      shipping,
    );
    expect(cart.lines.map((l) => l.issue)).toEqual([null, "out-of-stock", "unavailable"]);
    expect(cart.subtotal).toBe(9800);
    expect(cart.itemCount).toBe(2);
    expect(cart.hasIssues).toBe(true);
  });

  it("caps a single line at the per-line maximum even with large stock", () => {
    expect(clampLineQuantity(500, 10_000)).toBe(MAX_QUANTITY_PER_LINE);
  });

  it("normalises invalid quantities", () => {
    expect(clampLineQuantity(-3, 10)).toBe(0);
    expect(clampLineQuantity(2.9, 10)).toBe(2);
    expect(clampLineQuantity(Number.NaN, 10)).toBe(0);
    expect(clampLineQuantity(3, -1)).toBe(0);
  });
});

describe("shipping", () => {
  it("charges the flat fee below the threshold and reports what is missing", () => {
    const cart = calculateCart([line({ productId: "a", quantity: 2 })], shipping);
    expect(cart).toMatchObject({
      shipping: 1999,
      freeShipping: false,
      freeShippingRemaining: 25000 - 9800,
    });
    expect(cart.total).toBe(9800 + 1999);
  });

  it("is free exactly at the threshold", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 12500, quantity: 2 })], shipping);
    expect(cart).toMatchObject({
      subtotal: 25000,
      shipping: 0,
      freeShipping: true,
      freeShippingRemaining: null,
    });
  });

  it("is charged one ban below the threshold", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 24999 })], shipping);
    expect(cart).toMatchObject({ shipping: 1999, freeShippingRemaining: 1 });
  });

  it("compares the threshold against the subtotal after discounts", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 26000 })], shipping, [
      fixedDiscount(2000, "Cod"),
    ]);
    expect(cart).toMatchObject({
      subtotal: 26000,
      discount: 2000,
      shipping: 1999,
      total: 24000 + 1999,
    });
  });

  it("costs nothing for an empty cart", () => {
    const cart = calculateCart([], shipping);
    expect(cart).toMatchObject({
      itemCount: 0,
      subtotal: 0,
      shipping: 0,
      total: 0,
      freeShippingRemaining: null,
    });
  });

  it("never offers free shipping when the threshold is disabled", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 999_999 })], {
      flatFee: 1500,
      freeShippingThreshold: null,
    });
    expect(cart).toMatchObject({ shipping: 1500, freeShippingRemaining: null });
  });

  it("carts containing only unavailable items pay no shipping", () => {
    const cart = calculateCart([line({ productId: "a", stock: 0 })], shipping);
    expect(cart).toMatchObject({ itemCount: 0, shipping: 0, total: 0 });
  });
});

describe("discount hook", () => {
  it("applies a percentage rounded to the nearest ban", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 4999 })], shipping, [
      percentageDiscount(10, "10%"),
    ]);
    expect(cart.discount).toBe(500);
    expect(cart.total).toBe(4999 - 500 + 1999);
  });

  it("rounds half away from zero (1,5 bani → 2 bani)", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 15 })], shipping, [
      percentageDiscount(10, "10%"),
    ]);
    expect(cart.discount).toBe(2);
  });

  it("caps a percentage discount at its maximum", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 100_000 })], shipping, [
      percentageDiscount(50, "50%", 10_000),
    ]);
    expect(cart.discount).toBe(10_000);
  });

  it("never discounts below zero", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 1000 })], shipping, [
      fixedDiscount(5000, "Cod mare"),
    ]);
    expect(cart).toMatchObject({ discount: 1000, total: 0 + 1999 });
  });

  it("applies rules in order on the running subtotal", () => {
    const cart = calculateCart([line({ productId: "a", unitPrice: 10_000 })], shipping, [
      fixedDiscount(1000, "Fix"),
      percentageDiscount(10, "10%"),
    ]);
    expect(cart.discounts).toEqual([
      { label: "Fix", amount: 1000 },
      { label: "10%", amount: 900 },
    ]);
    expect(cart.discount).toBe(1900);
  });

  it("respects a minimum subtotal", () => {
    expect(
      calculateCart([line({ productId: "a" })], shipping, [fixedDiscount(500, "Min", 10_000)])
        .discount,
    ).toBe(0);
  });

  it("supports a free-shipping rule", () => {
    const cart = calculateCart([line({ productId: "a" })], shipping, [
      freeShippingDiscount("Transport gratuit"),
    ]);
    expect(cart).toMatchObject({ shipping: 0, freeShipping: true, total: 4900, discounts: [] });
  });

  it("ignores rules on an empty cart", () => {
    expect(calculateCart([], shipping, [fixedDiscount(500, "Fix")]).discount).toBe(0);
  });
});

describe("RON rounding", () => {
  it("keeps every amount an integer number of bani", () => {
    const cart = calculateCart(
      [
        line({ productId: "a", unitPrice: 3333, quantity: 3 }),
        line({ productId: "b", unitPrice: 1999, quantity: 7 }),
      ],
      shipping,
      [percentageDiscount(15, "15%")],
    );
    for (const value of [cart.subtotal, cart.discount, cart.shipping, cart.total]) {
      expect(Number.isInteger(value)).toBe(true);
    }
    expect(cart.subtotal).toBe(9999 + 13993);
    expect(cart.discount).toBe(3599); // 15% of 23 992 = 3 598,8 → 3 599
    expect(nbsp(formatMoney(cart.total))).toBe("223,92 RON"); // 203,93 + 19,99 shipping
  });
});
