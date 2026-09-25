import "server-only";

import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

import { assertCan, can, type Actor } from "../auth/permissions";

import { fillDays, funnel, percentChange } from "./metrics";
import { LOW_STOCK } from "./products";

const DAYS = 30;
const CLOSED: OrderStatus[] = ["CANCELLED", "REFUNDED"];

export async function getDashboard(actor: Actor) {
  assertCan(actor, "admin:access");
  const sales = can(actor.roles, "orders:manage");
  const now = new Date();
  const since = new Date(now.getTime() - DAYS * 86_400_000);
  const before = new Date(since.getTime() - DAYS * 86_400_000);

  const [
    daily,
    current,
    previous,
    statusCounts,
    top,
    events,
    lowStock,
    pendingReviews,
    subscribers,
    newCustomers,
    recent,
  ] = await Promise.all([
    sales
      ? db.$queryRaw<Array<{ day: string; revenue: bigint; orders: bigint }>>`
            SELECT to_char(("placedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Bucharest', 'YYYY-MM-DD') AS day,
                   SUM(total)::bigint AS revenue, COUNT(*)::bigint AS orders
            FROM orders
            WHERE "placedAt" >= ${since} AND status NOT IN ('CANCELLED', 'REFUNDED')
            GROUP BY 1`
      : Promise.resolve([]),
    sales
      ? db.order.aggregate({
          where: { placedAt: { gte: since }, status: { notIn: CLOSED } },
          _sum: { total: true },
          _count: true,
        })
      : null,
    sales
      ? db.order.aggregate({
          where: { placedAt: { gte: before, lt: since }, status: { notIn: CLOSED } },
          _sum: { total: true },
          _count: true,
        })
      : null,
    sales ? db.order.groupBy({ by: ["status"], _count: true }) : Promise.resolve([]),
    sales
      ? db.orderItem.groupBy({
          by: ["productName"],
          where: { order: { placedAt: { gte: since }, status: { notIn: CLOSED } } },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: "desc" } },
          take: 5,
        })
      : Promise.resolve([]),
    db.analyticsEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    db.product.findMany({
      where: { active: true, stock: { lte: LOW_STOCK } },
      orderBy: { stock: "asc" },
      take: 6,
      select: { id: true, name: true, stock: true },
    }),
    db.review.count({ where: { status: "PENDING" } }),
    db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    db.user.count({ where: { createdAt: { gte: since } } }),
    sales
      ? db.order.findMany({
          orderBy: { placedAt: "desc" },
          take: 6,
          select: {
            id: true,
            number: true,
            total: true,
            status: true,
            placedAt: true,
            email: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const revenue = current?._sum.total ?? 0;
  const orders = current?._count ?? 0;
  const eventCount = (name: string) => events.find((e) => e.name === name)?._count ?? 0;

  return {
    sales,
    days: DAYS,
    series: fillDays(
      daily.map((d) => ({ day: d.day, revenue: Number(d.revenue), orders: Number(d.orders) })),
      DAYS,
      now,
    ),
    kpis: {
      revenue,
      revenueChange: percentChange(revenue, previous?._sum.total ?? 0),
      orders,
      ordersChange: percentChange(orders, previous?._count ?? 0),
      averageOrder: orders ? Math.round(revenue / orders) : 0,
      newCustomers,
      subscribers,
      pendingReviews,
    },
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])) as Partial<
      Record<OrderStatus, number>
    >,
    topProducts: top.map((t) => ({ name: t.productName, quantity: t._sum.quantity ?? 0 })),
    funnel: funnel([
      { name: "product_view", label: "Vizualizări produs", count: eventCount("product_view") },
      { name: "add_to_cart", label: "Adăugări în coș", count: eventCount("add_to_cart") },
      {
        name: "checkout_started",
        label: "Checkout început",
        count: eventCount("checkout_started"),
      },
      {
        name: "order_completed",
        label: "Comenzi finalizate",
        count: eventCount("order_completed"),
      },
    ]),
    lowStock,
    recent,
  };
}
