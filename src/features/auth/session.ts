import "server-only";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { env } from "@/lib/env";
import { can, type Permission } from "@/services/auth/permissions";
import { getSession, SESSION_TTL_DAYS, type ActiveSession } from "@/services/auth/sessions";
import { hashIp } from "@/services/auth/tokens";

export const SESSION_COOKIE = "ar_session";

/** The current request's session (deduplicated per request). */
export const getCurrentSession = cache(async (): Promise<ActiveSession | null> => {
  const jar = await cookies();
  return getSession(jar.get(SESSION_COOKIE)?.value);
});

export async function getCurrentUser() {
  return (await getCurrentSession())?.user ?? null;
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Server-side guard for account pages and actions. Redirects to login when signed out. */
export async function requireUser(nextPath = "/cont"): Promise<ActiveSession> {
  const session = await getCurrentSession();
  if (!session) redirect(`/cont/autentificare?next=${encodeURIComponent(nextPath)}`);
  return session;
}

/**
 * Guard for admin areas and actions. Non-authorised users get a 404 so the
 * admin area's existence is not revealed.
 */
export async function requirePermission(permission: Permission): Promise<ActiveSession> {
  const session = await getCurrentSession();
  if (!session) redirect(`/cont/autentificare?next=${encodeURIComponent("/admin")}`);
  if (!can(session.user.roles, permission)) notFound();
  return session;
}

/** Client IP (first X-Forwarded-For hop), user agent and the salted IP hash used in consent records. */
export async function getRequestMeta() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const userAgent = h.get("user-agent");
  return { ip, userAgent, ipHash: hashIp(ip, env().AUTH_SECRET ?? "dev-only-salt") };
}
