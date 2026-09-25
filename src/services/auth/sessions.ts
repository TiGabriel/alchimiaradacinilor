import "server-only";

import { db } from "@/lib/db";

import { generateToken, hashToken } from "./tokens";

export const SESSION_TTL_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;
/** Sliding expiry: extend once less than this much lifetime remains. */
const REFRESH_WHEN_REMAINING_MS = (SESSION_TTL_DAYS / 2) * DAY;

export type SessionUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  roles: string[];
};

export type ActiveSession = { sessionId: string; expiresAt: Date; user: SessionUser };

export async function createSession(
  userId: string,
  meta: { ipAddress?: string | null; userAgent?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * DAY);
  await db.session.create({
    data: {
      token: hashToken(token),
      userId,
      expiresAt,
      ipAddress: meta.ipAddress ?? null,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });
  return { token, expiresAt };
}

/** Resolves a raw cookie token to a live session (and extends it when half-used). */
export async function getSession(token: string | null | undefined): Promise<ActiveSession | null> {
  if (!token || token.length > 100) return null;
  const session = await db.session.findUnique({
    where: { token: hashToken(token) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          emailVerifiedAt: true,
          roles: { select: { role: { select: { key: true } } } },
        },
      },
    },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  let expiresAt = session.expiresAt;
  if (expiresAt.getTime() - Date.now() < REFRESH_WHEN_REMAINING_MS) {
    expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * DAY);
    await db.session.update({ where: { id: session.id }, data: { expiresAt } });
  }
  const { user } = session;
  return {
    sessionId: session.id,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerifiedAt !== null,
      roles: user.roles.map((r) => r.role.key),
    },
  };
}

export async function deleteSession(token: string | null | undefined) {
  if (!token) return;
  await db.session.deleteMany({ where: { token: hashToken(token) } });
}

/** Signs the user out everywhere (optionally keeping the current session). */
export async function deleteUserSessions(userId: string, exceptSessionId?: string) {
  await db.session.deleteMany({
    where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
  });
}
