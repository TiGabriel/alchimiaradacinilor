import "server-only";

import { db } from "@/lib/db";

export async function getAdminStats() {
  const [products, activeProducts, users, verifiedUsers, subscribers, orders] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { active: true } }),
    db.user.count(),
    db.user.count({ where: { emailVerifiedAt: { not: null } } }),
    db.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
    db.order.count(),
  ]);
  return { products, activeProducts, users, verifiedUsers, subscribers, orders };
}
