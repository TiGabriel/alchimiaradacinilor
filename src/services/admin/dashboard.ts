import "server-only";

import { db } from "@/lib/db";

import { assertCan, can, type Actor } from "../auth/permissions";

import { fillDays, percentChange, rate, shopDay } from "./metrics";

const DAYS = 30;

/** Where a "Cumpără de pe doTERRA" button was clicked (see services/affiliate/links). */
const sourceLabels: Record<string, string> = {
  produs: "Pagina produsului",
  acasa: "Prima pagină",
  previzualizare: "Previzualizare rapidă",
  quiz: "Rezultatul quizului",
  ritual: "Ritualuri",
  favorite: "Salvate",
  jurnal: "Jurnal",
  newsletter: "Newsletter",
  altul: "Altă sursă",
};

export async function getDashboard(actor: Actor) {
  assertCan(actor, "admin:access");
  const catalog = can(actor.roles, "catalog:edit");
  const people = can(actor.roles, "users:manage");
  const content = can(actor.roles, "content:edit");
  const now = new Date();
  const since = new Date(now.getTime() - DAYS * 86_400_000);
  const before = new Date(since.getTime() - DAYS * 86_400_000);
  // Outbound clicks are counted per calendar day (a DATE column), so compare whole days.
  const asDay = (date: Date) => new Date(`${shopDay(date)}T00:00:00Z`);
  const sinceDay = asDay(since);
  const beforeDay = asDay(before);

  const [
    dailySignups,
    newMembers,
    previousMembers,
    events,
    pendingReviews,
    subscribers,
    newSubscribers,
    products,
    activeProducts,
    users,
    quizResults,
    articles,
    recentUsers,
    clicks,
    previousClicks,
    clicksByProduct,
    clicksBySource,
    withoutLink,
  ] = await Promise.all([
    db.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Bucharest', 'YYYY-MM-DD') AS day,
             COUNT(*)::bigint AS count
      FROM users
      WHERE "createdAt" >= ${since}
      GROUP BY 1`,
    db.user.count({ where: { createdAt: { gte: since } } }),
    db.user.count({ where: { createdAt: { gte: before, lt: since } } }),
    db.analyticsEvent.groupBy({
      by: ["name"],
      where: { createdAt: { gte: since } },
      _count: true,
    }),
    db.review.count({ where: { status: "PENDING" } }),
    db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    db.newsletterSubscriber.count({ where: { status: "ACTIVE", confirmedAt: { gte: since } } }),
    // All-time totals, each only for the roles allowed to see that area.
    catalog ? db.product.count() : null,
    catalog ? db.product.count({ where: { active: true } }) : null,
    people ? db.user.count() : null,
    content ? db.quizResult.count() : null,
    content ? db.article.count({ where: { status: "PUBLISHED" } }) : null,
    people
      ? db.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, firstName: true, lastName: true, email: true, createdAt: true },
        })
      : Promise.resolve([]),
    db.outboundClickDaily.aggregate({ where: { day: { gte: sinceDay } }, _sum: { count: true } }),
    db.outboundClickDaily.aggregate({
      where: { day: { gte: beforeDay, lt: sinceDay } },
      _sum: { count: true },
    }),
    db.outboundClickDaily.groupBy({
      by: ["productId"],
      where: { day: { gte: sinceDay } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
      take: 8,
    }),
    db.outboundClickDaily.groupBy({
      by: ["source"],
      where: { day: { gte: sinceDay } },
      _sum: { count: true },
      orderBy: { _sum: { count: "desc" } },
    }),
    catalog ? db.product.count({ where: { active: true, referralUrl: null } }) : null,
  ]);

  const clickedProducts = await db.product.findMany({
    where: { id: { in: clicksByProduct.map((c) => c.productId) } },
    select: { id: true, name: true },
  });
  const productName = (id: string) =>
    clickedProducts.find((p) => p.id === id)?.name ?? "Produs șters";

  const eventCount = (name: string) => events.find((e) => e.name === name)?._count ?? 0;
  const quizStarted = eventCount("quiz_started");
  const quizCompleted = eventCount("quiz_completed");

  return {
    days: DAYS,
    signups: fillDays(
      dailySignups.map((d) => ({ day: d.day, count: Number(d.count) })),
      DAYS,
      now,
    ),
    kpis: {
      newMembers,
      newMembersChange: percentChange(newMembers, previousMembers),
      subscribers,
      newSubscribers,
      pendingReviews,
    },
    activity: [
      { label: "Vizualizări produs", count: eventCount("product_view"), rate: null },
      { label: "Căutări", count: eventCount("search"), rate: null },
      { label: "Produse salvate", count: eventCount("wishlist_add"), rate: null },
      { label: "Quiz început", count: quizStarted, rate: null },
      { label: "Quiz terminat", count: quizCompleted, rate: rate(quizCompleted, quizStarted) },
    ],
    outbound: {
      clicks: clicks._sum.count ?? 0,
      change: percentChange(clicks._sum.count ?? 0, previousClicks._sum.count ?? 0),
      topProducts: clicksByProduct.map((c) => ({
        label: productName(c.productId),
        value: c._sum.count ?? 0,
      })),
      bySource: clicksBySource.map((c) => ({
        label: sourceLabels[c.source] ?? c.source,
        value: c._sum.count ?? 0,
      })),
      /** Active products still showing "Link în curând"; null when the role may not see the catalog. */
      withoutLink,
    },
    /** All-time figures; null where the role may not see that area. */
    totals: { products, activeProducts, users, quizResults, articles },
    recentUsers,
  };
}
