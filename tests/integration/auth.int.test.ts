import { describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import {
  AuthError,
  authenticate,
  changePassword,
  createEmailVerificationToken,
  createPasswordResetToken,
  resetPassword,
  verifyEmail,
} from "@/services/auth/accounts";
import { createSession, deleteUserSessions, getSession } from "@/services/auth/sessions";
import { hashToken } from "@/services/auth/tokens";
import {
  getNewsletterState,
  getUserConsents,
  setNewsletterConsent,
} from "@/services/consent/consent";

import { makeUser, meta } from "./helpers";

describe("registration", () => {
  it("creates a customer with a hashed password and a privacy consent record", async () => {
    const user = await makeUser();
    const stored = await db.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { roles: { include: { role: true } }, accounts: true, consents: true },
    });
    expect(stored.roles.map((r) => r.role.key)).toEqual(["customer"]);
    expect(stored.emailVerifiedAt).toBeNull();
    expect(stored.accounts[0]?.password).toMatch(/^\$argon2id\$/);
    expect(stored.accounts[0]?.password).not.toContain("lavanda2026");
    expect(stored.consents).toHaveLength(1);
    expect(stored.consents[0]).toMatchObject({
      purpose: "PRIVACY_POLICY",
      granted: true,
      policyVersion: "2026-09-draft",
      source: "test",
    });
  });

  it("records marketing consent only when given, pending until verification", async () => {
    const without = await makeUser({ email: "fara@example.ro" });
    expect((await getUserConsents(without.id)).latest.has("NEWSLETTER")).toBe(false);
    expect(await db.newsletterSubscriber.count()).toBe(0);

    const withConsent = await makeUser({ email: "cu@example.ro", marketingConsent: "on" });
    const { latest } = await getUserConsents(withConsent.id);
    expect(latest.get("NEWSLETTER")).toMatchObject({ granted: true });
    expect(latest.get("NEWSLETTER")?.createdAt).toBeInstanceOf(Date);
    expect((await getNewsletterState(withConsent.id)).status).toBe("PENDING");
  });

  it("rejects a duplicate email (case-insensitive)", async () => {
    await makeUser();
    await expect(makeUser({ email: "ANA@example.ro" })).rejects.toMatchObject({
      code: "email-taken",
    });
  });
});

describe("login", () => {
  it("accepts the right password and rejects wrong or unknown credentials alike", async () => {
    const user = await makeUser();
    await expect(authenticate("ana@example.ro", "lavanda2026")).resolves.toMatchObject({
      id: user.id,
    });
    await expect(authenticate("ana@example.ro", "gresit2026")).rejects.toBeInstanceOf(AuthError);
    await expect(authenticate("nimeni@example.ro", "lavanda2026")).rejects.toMatchObject({
      code: "invalid-credentials",
      message: "Emailul sau parola nu sunt corecte.",
    });
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: user.id } })).lastLoginAt,
    ).not.toBeNull();
  });
});

describe("sessions", () => {
  it("stores only a hash of the token and resolves the user with roles", async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id, { ipAddress: "1.2.3.4", userAgent: "vitest" });
    expect(await db.session.count({ where: { token } })).toBe(0);
    expect(await db.session.count({ where: { token: hashToken(token) } })).toBe(1);
    const session = await getSession(token);
    expect(session?.user).toMatchObject({ id: user.id, roles: ["customer"], emailVerified: false });
    expect(await getSession("wrong-token")).toBeNull();
  });

  it("drops expired sessions and can revoke all others", async () => {
    const user = await makeUser();
    const a = await createSession(user.id);
    const b = await createSession(user.id);
    await db.session.updateMany({
      where: { token: hashToken(a.token) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await getSession(a.token)).toBeNull();
    const keep = (await getSession(b.token))!.sessionId;
    await createSession(user.id);
    await deleteUserSessions(user.id, keep);
    expect(await db.session.count({ where: { userId: user.id } })).toBe(1);
  });
});

describe("email verification", () => {
  it("verifies once, activates a pending subscription and rejects reuse", async () => {
    const user = await makeUser({ marketingConsent: "on" });
    const token = await createEmailVerificationToken(user.id);
    await verifyEmail(token);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt,
    ).not.toBeNull();
    expect(await getNewsletterState(user.id)).toMatchObject({ status: "ACTIVE", subscribed: true });
    await expect(verifyEmail(token)).rejects.toMatchObject({ code: "invalid-token" });
  });

  it("rejects expired tokens and invalidates older links", async () => {
    const user = await makeUser();
    const first = await createEmailVerificationToken(user.id);
    const second = await createEmailVerificationToken(user.id);
    await expect(verifyEmail(first)).rejects.toMatchObject({ code: "invalid-token" });
    await db.verification.updateMany({ data: { expiresAt: new Date(Date.now() - 1) } });
    await expect(verifyEmail(second)).rejects.toMatchObject({ message: "Linkul a expirat." });
  });

  it("does not accept a reset token as a verification token", async () => {
    await makeUser();
    const issued = await createPasswordResetToken("ana@example.ro");
    await expect(verifyEmail(issued!.token)).rejects.toMatchObject({ code: "invalid-token" });
  });
});

describe("password reset and change", () => {
  it("returns null for unknown emails", async () => {
    expect(await createPasswordResetToken("nimeni@example.ro")).toBeNull();
  });

  it("sets the new password, revokes every session and verifies the email", async () => {
    const user = await makeUser();
    await createSession(user.id);
    const issued = await createPasswordResetToken("ana@example.ro");
    await resetPassword(issued!.token, "rozmarin2027");
    await expect(authenticate("ana@example.ro", "lavanda2026")).rejects.toBeInstanceOf(AuthError);
    await expect(authenticate("ana@example.ro", "rozmarin2027")).resolves.toBeTruthy();
    expect(await db.session.count({ where: { userId: user.id } })).toBe(0);
    expect(
      (await db.user.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt,
    ).not.toBeNull();
    await expect(resetPassword(issued!.token, "altaparola2027")).rejects.toMatchObject({
      code: "invalid-token",
    });
  });

  it("changes the password only with the current one, keeping the current session", async () => {
    const user = await makeUser();
    const current = await createSession(user.id);
    await createSession(user.id);
    const sessionId = (await getSession(current.token))!.sessionId;
    await expect(
      changePassword(user.id, "gresit2026", "nou2027parola", sessionId),
    ).rejects.toMatchObject({ code: "wrong-password" });
    await changePassword(user.id, "lavanda2026", "nou2027parola", sessionId);
    await expect(authenticate("ana@example.ro", "nou2027parola")).resolves.toBeTruthy();
    expect(await db.session.findMany({ where: { userId: user.id }, select: { id: true } })).toEqual(
      [{ id: sessionId }],
    );
  });
});

describe("newsletter consent", () => {
  it("records withdrawal as a new consent record and unsubscribes", async () => {
    const user = await makeUser({ marketingConsent: "on" });
    await verifyEmail(await createEmailVerificationToken(user.id));
    await setNewsletterConsent(user.id, false, meta);

    const state = await getNewsletterState(user.id);
    expect(state).toMatchObject({ subscribed: false, status: "UNSUBSCRIBED" });
    expect(state.withdrawnAt).toBeInstanceOf(Date);
    const records = await db.consentRecord.findMany({
      where: { userId: user.id, purpose: "NEWSLETTER" },
      orderBy: { createdAt: "asc" },
    });
    expect(records.map((r) => r.granted)).toEqual([true, false]);

    await setNewsletterConsent(user.id, true, meta);
    expect(await getNewsletterState(user.id)).toMatchObject({ subscribed: true, status: "ACTIVE" });
  });
});

describe("role guards", () => {
  async function guardWithSession(token: string | undefined) {
    vi.resetModules();
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) => (name === "ar_session" && token ? { value: token } : undefined),
      }),
      headers: async () => new Headers(),
    }));
    vi.doMock("next/navigation", () => ({
      redirect: (url: string) => {
        throw new Error(`REDIRECT ${url}`);
      },
      notFound: () => {
        throw new Error("NOT_FOUND");
      },
    }));
    return import("@/features/auth/session");
  }

  it("redirects signed-out visitors to login", async () => {
    const { requireUser, requirePermission } = await guardWithSession(undefined);
    await expect(requireUser("/cont/adrese")).rejects.toThrow(
      "REDIRECT /cont/autentificare?next=%2Fcont%2Fadrese",
    );
    await expect(requirePermission("admin:access")).rejects.toThrow(/REDIRECT/);
  });

  it("hides the admin area from customers and lets admins in", async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id);
    const customer = await guardWithSession(token);
    await expect(customer.requireUser()).resolves.toMatchObject({ user: { id: user.id } });
    await expect(customer.requirePermission("admin:access")).rejects.toThrow("NOT_FOUND");

    const admin = await db.role.create({ data: { key: "admin", name: "Administrator" } });
    await db.userRole.create({ data: { userId: user.id, roleId: admin.id } });
    const asAdmin = await guardWithSession(token);
    await expect(asAdmin.requirePermission("admin:access")).resolves.toMatchObject({
      user: { roles: expect.arrayContaining(["admin"]) },
    });
  });
});
