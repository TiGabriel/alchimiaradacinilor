/**
 * Order pricing — pure and unit-tested. The same function prices the cart
 * estimate, the checkout summary and the order inside the placement
 * transaction, so what the customer sees is what is charged.
 */
import type { ShippingMethod } from "@/validation/settings";

import {
  calculateCart,
  type CartLineInput,
  type CartTotals,
  type DiscountRule,
  type ShippingRules,
} from "../cart/calculate";
import type { CouponCheck } from "../coupons/evaluate";

type ShippingSettings = { freeShippingThreshold: number | null; methods: ShippingMethod[] };

export function activeShippingMethods(settings: ShippingSettings): ShippingMethod[] {
  return settings.methods.filter((m) => m.active);
}

/**
 * The chosen active method, or the first active one when none is chosen.
 * A code that is unknown or inactive resolves to null (the customer must choose again).
 */
export function resolveShippingMethod(
  settings: ShippingSettings,
  code?: string | null,
): ShippingMethod | null {
  const active = activeShippingMethods(settings);
  if (!code) return active[0] ?? null;
  return active.find((m) => m.code === code) ?? null;
}

export function shippingRulesFor(
  settings: ShippingSettings,
  method: ShippingMethod,
): ShippingRules {
  return {
    flatFee: method.price,
    freeShippingThreshold: method.freeShippingEligible ? settings.freeShippingThreshold : null,
  };
}

/** VAT contained in a VAT-inclusive amount, rounded to the nearest ban. */
export function includedVat(amount: number, ratePercent: number): number {
  if (ratePercent <= 0 || amount <= 0) return 0;
  return Math.round((amount * ratePercent) / (100 + ratePercent));
}

export type AppliedCoupon = { label: string; check: CouponCheck };

export type OrderPricing<T extends CartLineInput> = CartTotals<T> & {
  /** VAT included in `total`. */
  tax: number;
  /** True when a coupon produced a discount or free shipping. */
  couponApplied: boolean;
};

export function priceOrder<T extends CartLineInput>(
  lines: T[],
  options: {
    shipping: ShippingSettings;
    method: ShippingMethod;
    coupon?: AppliedCoupon | null;
    vatRatePercent: number;
  },
): OrderPricing<T> {
  const rules: DiscountRule[] = [];
  const check = options.coupon?.check;
  let couponApplied = false;
  if (check?.ok) {
    const freeShipping = check.freeShipping && options.method.freeShippingEligible;
    if (check.discount > 0 || freeShipping) {
      couponApplied = true;
      rules.push(() => ({ amount: check.discount, label: options.coupon!.label, freeShipping }));
    }
  }
  const totals = calculateCart(lines, shippingRulesFor(options.shipping, options.method), rules);
  return {
    ...totals,
    tax: includedVat(totals.total, options.vatRatePercent),
    couponApplied,
  };
}
