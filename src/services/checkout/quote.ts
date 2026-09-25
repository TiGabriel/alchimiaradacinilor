import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getSettings } from "@/services/settings";
import type { ShippingMethod } from "@/validation/settings";

import { calculateLine, type CartLineInput } from "../cart/calculate";
import { evaluateCouponFor, findCouponById, type EvaluatedCoupon } from "../coupons/coupons";

import { priceOrder, resolveShippingMethod, type OrderPricing } from "./pricing";

type Client = Prisma.TransactionClient | typeof db;

export type QuoteLine = CartLineInput & { categoryId: string };

export type Quote<T extends QuoteLine> = {
  pricing: OrderPricing<T>;
  /** null when the requested method is unknown/inactive. */
  method: ShippingMethod | null;
  /** The method the totals were computed with (the default when `method` is null). */
  pricedMethod: ShippingMethod;
  coupon: EvaluatedCoupon | null;
};

/**
 * Prices lines exactly as an order would be charged: DB prices and stock,
 * the chosen (or default) delivery method, the cart's coupon re-evaluated now.
 * Used by the cart view, the checkout summary and order placement.
 */
export async function buildQuote<T extends QuoteLine>(
  lines: T[],
  options: {
    couponId: string | null;
    customer: { userId: string; email: string } | null;
    methodCode?: string | null;
    client?: Client;
  },
): Promise<Quote<T>> {
  const client = options.client ?? db;
  const settings = await getSettings();
  const resolved = resolveShippingMethod(settings.shipping, options.methodCode);
  // Price with the default method when the requested one is gone, so totals stay meaningful.
  const method = resolved ?? resolveShippingMethod(settings.shipping)!;

  let coupon: EvaluatedCoupon | null = null;
  if (options.couponId) {
    const definition = await findCouponById(options.couponId, client);
    if (definition) {
      const calculated = lines.map(calculateLine);
      coupon = await evaluateCouponFor(
        definition,
        calculated.map((l) => ({
          productId: l.productId,
          categoryId: l.categoryId,
          lineTotal: l.lineTotal,
        })),
        options.customer,
        client,
      );
    }
  }

  const pricing = priceOrder(lines, {
    shipping: settings.shipping,
    method,
    coupon: coupon ? { label: coupon.label, check: coupon.check } : null,
    vatRatePercent: settings.tax.vatRatePercent,
  });
  return { pricing, method: resolved, pricedMethod: method, coupon };
}
