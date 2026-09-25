import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import {
  couponLabel,
  evaluateCoupon,
  normalizeCouponCode,
  type CouponCheck,
  type CouponDefinition,
  type CouponLine,
} from "./evaluate";

type Client = Prisma.TransactionClient | typeof db;

const couponSelect = {
  id: true,
  code: true,
  type: true,
  value: true,
  minSubtotal: true,
  maxDiscount: true,
  startsAt: true,
  endsAt: true,
  usageLimit: true,
  perCustomerLimit: true,
  active: true,
  products: { select: { productId: true } },
  categories: { select: { categoryId: true } },
} satisfies Prisma.CouponSelect;

type CouponRow = Prisma.CouponGetPayload<{ select: typeof couponSelect }>;

function toDefinition(row: CouponRow): CouponDefinition {
  const { products, categories, ...rest } = row;
  return {
    ...rest,
    productIds: products.map((p) => p.productId),
    categoryIds: categories.map((c) => c.categoryId),
  };
}

export async function findCouponByCode(raw: string, client: Client = db) {
  const code = normalizeCouponCode(raw);
  if (!code) return null;
  const row = await client.coupon.findUnique({ where: { code }, select: couponSelect });
  return row ? toDefinition(row) : null;
}

export async function findCouponById(id: string, client: Client = db) {
  const row = await client.coupon.findUnique({ where: { id }, select: couponSelect });
  return row ? toDefinition(row) : null;
}

/** Past uses: in total and by this customer (by account or order email). */
export async function couponUsageCounts(
  couponId: string,
  customer: { userId: string; email: string } | null,
  client: Client = db,
) {
  const [total, mine] = await Promise.all([
    client.couponUsage.count({ where: { couponId } }),
    customer
      ? client.couponUsage.count({
          where: { couponId, OR: [{ userId: customer.userId }, { email: customer.email }] },
        })
      : Promise.resolve(null),
  ]);
  return { total, customer: mine };
}

/** Each category id mapped to itself plus all its ancestors. */
export async function categoryAncestry(client: Client = db): Promise<Map<string, string[]>> {
  const rows = await client.category.findMany({ select: { id: true, parentId: true } });
  const parent = new Map(rows.map((r) => [r.id, r.parentId]));
  const result = new Map<string, string[]>();
  for (const { id } of rows) {
    const chain: string[] = [];
    let current: string | null | undefined = id;
    while (current && !chain.includes(current)) {
      chain.push(current);
      current = parent.get(current);
    }
    result.set(id, chain);
  }
  return result;
}

export type CouponLineSource = { productId: string; categoryId: string; lineTotal: number };

export type EvaluatedCoupon = { code: string; label: string; check: CouponCheck };

/** Loads what the rules need (usage, category tree) and evaluates the coupon for these lines. */
export async function evaluateCouponFor(
  coupon: CouponDefinition,
  lines: CouponLineSource[],
  customer: { userId: string; email: string } | null,
  client: Client = db,
  now = new Date(),
): Promise<EvaluatedCoupon> {
  const [usage, ancestry] = await Promise.all([
    couponUsageCounts(coupon.id, customer, client),
    categoryAncestry(client),
  ]);
  const couponLines: CouponLine[] = lines.map((l) => ({
    productId: l.productId,
    categoryIds: ancestry.get(l.categoryId) ?? [l.categoryId],
    lineTotal: l.lineTotal,
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return {
    code: coupon.code,
    label: couponLabel(coupon),
    check: evaluateCoupon(coupon, { now, lines: couponLines, subtotal, usage }),
  };
}
