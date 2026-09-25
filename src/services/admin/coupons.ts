import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { couponFormSchema } from "@/validation/admin/coupon";

import { assertCan, type Actor } from "../auth/permissions";

import { AdminError } from "./errors";

export async function listCouponsWithStats(actor: Actor) {
  assertCan(actor, "orders:manage");
  const [coupons, usage, revenue] = await Promise.all([
    db.coupon.findMany({
      orderBy: [{ active: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { products: true, categories: true } } },
    }),
    db.couponUsage.groupBy({ by: ["couponId"], _count: true, _sum: { discountAmount: true } }),
    db.order.groupBy({
      by: ["couponId"],
      where: { couponId: { not: null }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { total: true },
    }),
  ]);
  const usageBy = new Map(usage.map((u) => [u.couponId, u]));
  const revenueBy = new Map(revenue.map((r) => [r.couponId, r._sum.total ?? 0]));
  return coupons.map((c) => ({
    ...c,
    uses: usageBy.get(c.id)?._count ?? 0,
    discountGiven: usageBy.get(c.id)?._sum.discountAmount ?? 0,
    revenue: revenueBy.get(c.id) ?? 0,
    restricted: c._count.products + c._count.categories > 0,
  }));
}

export async function getCoupon(actor: Actor, id: string) {
  assertCan(actor, "orders:manage");
  return db.coupon.findUnique({
    where: { id },
    include: {
      products: { select: { productId: true } },
      categories: { select: { categoryId: true } },
      _count: { select: { usages: true } },
    },
  });
}

export async function getCouponFormOptions(actor: Actor) {
  assertCan(actor, "orders:manage");
  const [products, categories] = await Promise.all([
    db.product.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, sku: true } }),
    db.category.findMany({
      orderBy: [{ parentId: { sort: "asc", nulls: "first" } }, { position: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
  ]);
  return { products, categories };
}

export async function saveCoupon(actor: Actor, raw: unknown, id?: string) {
  assertCan(actor, "orders:manage");
  const { productIds, categoryIds, ...data } = couponFormSchema.parse(raw);
  try {
    return await db.$transaction(async (tx) => {
      const coupon = id
        ? await tx.coupon.update({ where: { id }, data })
        : await tx.coupon.create({ data });
      await tx.couponProduct.deleteMany({ where: { couponId: coupon.id } });
      await tx.couponCategory.deleteMany({ where: { couponId: coupon.id } });
      if (productIds.length)
        await tx.couponProduct.createMany({
          data: productIds.map((productId) => ({ couponId: coupon.id, productId })),
        });
      if (categoryIds.length)
        await tx.couponCategory.createMany({
          data: categoryIds.map((categoryId) => ({ couponId: coupon.id, categoryId })),
        });
      return { id: coupon.id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002")
      throw new AdminError("Codul există deja.", { code: "Alege un alt cod." });
    throw error;
  }
}

/** Used coupons stay (orders reference them) — they can only be deactivated. */
export async function deleteCoupon(actor: Actor, id: string) {
  assertCan(actor, "orders:manage");
  const used = await db.couponUsage.count({ where: { couponId: id } });
  if (used)
    throw new AdminError(
      "Codul a fost folosit în comenzi, așa că nu poate fi șters. Dezactivează-l.",
    );
  await db.coupon.deleteMany({ where: { id } });
}
