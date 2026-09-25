import "server-only";

import { db } from "@/lib/db";

export function getProfile(userId: string) {
  return db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
}

export function updateProfile(
  userId: string,
  data: { firstName: string; lastName: string; phone: string | null },
) {
  return db.user.update({ where: { id: userId }, data, select: { id: true } });
}

export function listSessions(userId: string) {
  return db.session.findMany({
    where: { userId, expiresAt: { gt: new Date() } },
    orderBy: { updatedAt: "desc" },
    select: { id: true, createdAt: true, updatedAt: true, userAgent: true },
  });
}
