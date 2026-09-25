import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";

import { assertCan, type Actor } from "../auth/permissions";
import { latestConsents } from "../consent/latest";

const PAGE_SIZE = 25;

export async function listCustomers(actor: Actor, filter: { q?: string; page?: number }) {
  assertCan(actor, "users:manage");
  const where: Prisma.UserWhereInput = filter.q
    ? {
        OR: [
          { email: { contains: filter.q, mode: "insensitive" } },
          { firstName: { contains: filter.q, mode: "insensitive" } },
          { lastName: { contains: filter.q, mode: "insensitive" } },
        ],
      }
    : {};
  const page = Math.max(1, filter.page ?? 1);
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        roles: { select: { role: { select: { key: true } } } },
        subscriber: { select: { status: true } },
        _count: { select: { orders: true } },
      },
    }),
  ]);
  const spent = users.length
    ? await db.order.groupBy({
        by: ["userId"],
        where: {
          userId: { in: users.map((u) => u.id) },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        _sum: { total: true },
      })
    : [];
  const spentBy = new Map(spent.map((s) => [s.userId, s._sum.total ?? 0]));
  return {
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    customers: users.map((u) => ({
      ...u,
      roles: u.roles.map((r) => r.role.key),
      totalSpent: spentBy.get(u.id) ?? 0,
    })),
  };
}

export async function getCustomer(actor: Actor, id: string) {
  assertCan(actor, "users:manage");
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      createdAt: true,
      emailVerifiedAt: true,
      lastLoginAt: true,
      roles: { select: { role: { select: { key: true, name: true } } } },
      addresses: { orderBy: { createdAt: "asc" } },
      orders: {
        orderBy: { placedAt: "desc" },
        select: { id: true, number: true, placedAt: true, status: true, total: true },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, status: true, product: { select: { name: true } } },
      },
      subscriber: { select: { status: true, confirmedAt: true, source: true } },
      consents: {
        orderBy: { createdAt: "asc" },
        select: { purpose: true, granted: true, createdAt: true, policyVersion: true },
      },
      _count: { select: { savedRoutines: true, quizResults: true } },
    },
  });
  if (!user) return null;
  const wishlistCount = await db.wishlistItem.count({ where: { wishlist: { userId: id } } });
  return {
    ...user,
    roles: user.roles.map((r) => r.role),
    latestConsents: [...latestConsents(user.consents).values()],
    wishlistCount,
    totalSpent: user.orders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "REFUNDED")
      .reduce((s, o) => s + o.total, 0),
  };
}
