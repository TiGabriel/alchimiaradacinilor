/**
 * Cart totals — pure and fully unit-tested. The server always recomputes the
 * cart from database prices and stock; nothing here trusts client input.
 *
 * All amounts are integer bani (1 RON = 100 bani).
 */
import { percentOf } from "@/lib/money";

/** Hard ceiling per line, independent of stock (protects against abuse and typos). */
export const MAX_QUANTITY_PER_LINE = 99;

export type CartLineInput = {
  productId: string;
  /** Requested quantity as stored in the cart. */
  quantity: number;
  /** Current unit price from the database (bani). */
  unitPrice: number;
  compareAtPrice: number | null;
  stock: number;
  /** false when the product was deactivated/removed. */
  available: boolean;
};

export type LineIssue = "out-of-stock" | "unavailable" | "quantity-reduced";

export type CalculatedLine<T extends CartLineInput = CartLineInput> = T & {
  /** Quantity that can actually be bought (0 when unavailable/out of stock). */
  quantity: number;
  requestedQuantity: number;
  lineTotal: number;
  issue: LineIssue | null;
};

export type ShippingRules = {
  /** Flat fee in bani. */
  flatFee: number;
  /** Subtotal (after discounts) from which shipping is free; null disables it. */
  freeShippingThreshold: number | null;
};

export type DiscountContext = { subtotal: number; itemCount: number };

export type DiscountResult = {
  /** Positive amount in bani; clamped to the subtotal. */
  amount: number;
  label: string;
  freeShipping?: boolean;
};

/**
 * Discount hook. Coupons (a later phase) plug in here as rules; the cart
 * phase ships with none. Rules are applied in order on the running subtotal.
 */
export type DiscountRule = (context: DiscountContext) => DiscountResult | null;

export type CartTotals<T extends CartLineInput = CartLineInput> = {
  lines: CalculatedLine<T>[];
  itemCount: number;
  subtotal: number;
  discount: number;
  discounts: Array<{ label: string; amount: number }>;
  shipping: number;
  freeShipping: boolean;
  /** Bani still needed for free shipping (null when not applicable or already free). */
  freeShippingRemaining: number | null;
  total: number;
  hasIssues: boolean;
};

export function clampLineQuantity(requested: number, stock: number): number {
  if (!Number.isFinite(requested)) return 0;
  return Math.max(0, Math.min(Math.trunc(requested), Math.max(0, stock), MAX_QUANTITY_PER_LINE));
}

export function calculateLine<T extends CartLineInput>(line: T): CalculatedLine<T> {
  const requested = Math.max(0, Math.trunc(line.quantity));
  let quantity = 0;
  let issue: LineIssue | null = null;

  if (!line.available) issue = "unavailable";
  else if (line.stock <= 0) issue = "out-of-stock";
  else {
    quantity = clampLineQuantity(requested, line.stock);
    if (quantity < requested) issue = "quantity-reduced";
  }

  return {
    ...line,
    requestedQuantity: requested,
    quantity,
    lineTotal: quantity * line.unitPrice,
    issue,
  };
}

export function calculateCart<T extends CartLineInput>(
  inputs: T[],
  shippingRules: ShippingRules,
  discountRules: DiscountRule[] = [],
): CartTotals<T> {
  const lines = inputs.map(calculateLine);
  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);

  const discounts: Array<{ label: string; amount: number }> = [];
  let remaining = subtotal;
  let freeShippingByDiscount = false;
  if (itemCount > 0) {
    for (const rule of discountRules) {
      const result = rule({ subtotal: remaining, itemCount });
      if (!result) continue;
      const amount = Math.max(0, Math.min(Math.round(result.amount), remaining));
      if (amount > 0) discounts.push({ label: result.label, amount });
      remaining -= amount;
      if (result.freeShipping) freeShippingByDiscount = true;
    }
  }
  const discount = subtotal - remaining;

  const { flatFee, freeShippingThreshold } = shippingRules;
  const reachesThreshold = freeShippingThreshold != null && remaining >= freeShippingThreshold;
  const freeShipping = itemCount > 0 && (reachesThreshold || freeShippingByDiscount);
  const shipping = itemCount === 0 || freeShipping ? 0 : flatFee;
  const freeShippingRemaining =
    itemCount > 0 && !freeShipping && freeShippingThreshold != null
      ? freeShippingThreshold - remaining
      : null;

  return {
    lines,
    itemCount,
    subtotal,
    discount,
    discounts,
    shipping,
    freeShipping,
    freeShippingRemaining,
    total: remaining + shipping,
    hasIssues: lines.some((l) => l.issue !== null),
  };
}

// ── Reference discount rules (used by tests; coupons build on these) ───────

export function percentageDiscount(
  percent: number,
  label: string,
  maxAmount?: number,
): DiscountRule {
  return ({ subtotal }) => {
    const amount = percentOf(subtotal, percent);
    return { amount: maxAmount != null ? Math.min(amount, maxAmount) : amount, label };
  };
}

export function fixedDiscount(amount: number, label: string, minSubtotal = 0): DiscountRule {
  return ({ subtotal }) => (subtotal >= minSubtotal ? { amount, label } : null);
}

export function freeShippingDiscount(label: string): DiscountRule {
  return () => ({ amount: 0, label, freeShipping: true });
}
