/**
 * Coupon rules — pure and unit-tested. The server loads the coupon, its usage
 * counts and the cart lines from the database and calls these functions; the
 * client never supplies amounts.
 */
import type { CouponType } from "@/generated/prisma/enums";
import { formatMoney, percentOf } from "@/lib/money";

export type CouponDefinition = {
  id: string;
  code: string;
  type: CouponType;
  /** Percent (1–100) for PERCENTAGE, bani for FIXED_AMOUNT, ignored for FREE_SHIPPING. */
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  active: boolean;
  /** Restrictions; both empty = the whole cart qualifies. */
  productIds: string[];
  /** Category ids (a line matches through its category or any ancestor). */
  categoryIds: string[];
};

export type CouponLine = {
  productId: string;
  /** The product's category and all its ancestors. */
  categoryIds: string[];
  lineTotal: number;
};

export type CouponContext = {
  now: Date;
  lines: CouponLine[];
  /** Whole-cart subtotal before discounts (bani). */
  subtotal: number;
  usage: {
    /** Orders that already used the coupon. */
    total: number;
    /** Orders by this customer; null when the customer is not known yet (guest cart). */
    customer: number | null;
  };
};

export type CouponRejection =
  | "not-found"
  | "not-started"
  | "expired"
  | "exhausted"
  | "customer-limit"
  | "empty-cart"
  | "not-applicable"
  | "min-subtotal";

export type CouponCheck =
  | { ok: true; discount: number; freeShipping: boolean; eligibleSubtotal: number }
  | { ok: false; reason: CouponRejection; message: string };

const dateFormat = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});

/** Codes are case-insensitive and ignore spaces: " primavara 10 " → "PRIMAVARA10". */
export function normalizeCouponCode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase();
}

export function isRestricted(coupon: Pick<CouponDefinition, "productIds" | "categoryIds">) {
  return coupon.productIds.length > 0 || coupon.categoryIds.length > 0;
}

/** Lines the coupon applies to. */
export function eligibleLines(
  coupon: Pick<CouponDefinition, "productIds" | "categoryIds">,
  lines: CouponLine[],
): CouponLine[] {
  if (!isRestricted(coupon)) return lines;
  const products = new Set(coupon.productIds);
  const categories = new Set(coupon.categoryIds);
  return lines.filter(
    (l) => products.has(l.productId) || l.categoryIds.some((c) => categories.has(c)),
  );
}

function reject(reason: CouponRejection, message: string): CouponCheck {
  return { ok: false, reason, message };
}

export function evaluateCoupon(
  coupon: CouponDefinition | null,
  context: CouponContext,
): CouponCheck {
  if (!coupon || !coupon.active)
    return reject("not-found", "Codul nu există sau nu mai este activ.");
  if (coupon.startsAt && coupon.startsAt > context.now)
    return reject(
      "not-started",
      `Codul poate fi folosit începând cu ${dateFormat.format(coupon.startsAt)}.`,
    );
  if (coupon.endsAt && coupon.endsAt < context.now) return reject("expired", "Codul a expirat.");
  if (coupon.usageLimit != null && context.usage.total >= coupon.usageLimit)
    return reject("exhausted", "Codul a atins numărul maxim de utilizări.");
  if (
    coupon.perCustomerLimit != null &&
    context.usage.customer != null &&
    context.usage.customer >= coupon.perCustomerLimit
  )
    return reject(
      "customer-limit",
      coupon.perCustomerLimit === 1
        ? "Ai folosit deja acest cod."
        : `Ai folosit deja acest cod de ${coupon.perCustomerLimit} ori.`,
    );

  const purchasable = context.lines.filter((l) => l.lineTotal > 0);
  if (purchasable.length === 0) return reject("empty-cart", "Coșul tău este gol.");

  const eligible = eligibleLines(coupon, purchasable);
  if (eligible.length === 0)
    return reject("not-applicable", "Codul nu se aplică produselor din coșul tău.");

  if (coupon.minSubtotal != null && context.subtotal < coupon.minSubtotal)
    return reject(
      "min-subtotal",
      `Codul este valabil pentru comenzi de minimum ${formatMoney(coupon.minSubtotal)}. Mai adaugă produse de ${formatMoney(coupon.minSubtotal - context.subtotal)}.`,
    );

  const eligibleSubtotal = eligible.reduce((sum, l) => sum + l.lineTotal, 0);
  let discount = 0;
  if (coupon.type === "PERCENTAGE")
    discount = percentOf(eligibleSubtotal, Math.max(0, Math.min(100, coupon.value)));
  else if (coupon.type === "FIXED_AMOUNT") discount = Math.max(0, coupon.value);
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, eligibleSubtotal);

  return {
    ok: true,
    discount,
    freeShipping: coupon.type === "FREE_SHIPPING",
    eligibleSubtotal,
  };
}

/** Customer-facing label for the discount line ("Cod PRIMAVARA (−10%)"). */
export function couponLabel(coupon: Pick<CouponDefinition, "code" | "type" | "value">): string {
  switch (coupon.type) {
    case "PERCENTAGE":
      return `Cod ${coupon.code} (−${coupon.value}%)`;
    case "FIXED_AMOUNT":
      return `Cod ${coupon.code}`;
    case "FREE_SHIPPING":
      return `Cod ${coupon.code} (livrare gratuită)`;
  }
}
