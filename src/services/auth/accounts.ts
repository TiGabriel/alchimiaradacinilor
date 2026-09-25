import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { recordConsent, type ConsentMeta } from "@/services/consent/consent";
import type { RegisterInput } from "@/validation/auth";

import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password";
import { deleteUserSessions } from "./sessions";
import { generateToken, hashToken } from "./tokens";

export const CREDENTIAL_PROVIDER = "credential";
export const EMAIL_VERIFICATION_HOURS = 24;
export const PASSWORD_RESET_MINUTES = 60;

export class AuthError extends Error {
  constructor(
    readonly code: "email-taken" | "invalid-token" | "invalid-credentials" | "wrong-password",
    message: string,
  ) {
    super(message);
  }
}

// ── Registration ────────────────────────────────────────────────────────────

export async function registerUser(input: RegisterInput, meta: ConsentMeta) {
  const passwordHash = await hashPassword(input.password);
  try {
    return await db.$transaction(async (tx) => {
      const customer = await tx.role.upsert({
        where: { key: "customer" },
        create: { key: "customer", name: "Client" },
        update: {},
      });
      const user = await tx.user.create({
        data: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          roles: { create: { roleId: customer.id } },
          accounts: {
            create: {
              providerId: CREDENTIAL_PROVIDER,
              accountId: input.email,
              password: passwordHash,
            },
          },
        },
        select: { id: true, email: true, firstName: true },
      });

      await recordConsent({ userId: user.id, purpose: "PRIVACY_POLICY", granted: true }, meta, tx);

      if (input.marketingConsent) {
        // Pending until the email address is verified (verification doubles as opt-in confirmation).
        const subscriber = await tx.newsletterSubscriber.upsert({
          where: { email: user.email },
          create: { email: user.email, userId: user.id, status: "PENDING", source: meta.source },
          update: { userId: user.id, status: "PENDING", unsubscribedAt: null },
        });
        await recordConsent(
          { userId: user.id, subscriberId: subscriber.id, purpose: "NEWSLETTER", granted: true },
          meta,
          tx,
        );
      }
      return user;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AuthError("email-taken", "Există deja un cont cu această adresă de email.");
    }
    throw error;
  }
}

// ── Login ───────────────────────────────────────────────────────────────────

export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      accounts: { where: { providerId: CREDENTIAL_PROVIDER }, select: { password: true } },
    },
  });
  const hash = user?.accounts[0]?.password;
  const ok = hash ? await verifyPassword(hash, password) : await verifyAgainstDummy(password);
  if (!user || !ok)
    throw new AuthError("invalid-credentials", "Emailul sau parola nu sunt corecte.");
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return { id: user.id, firstName: user.firstName };
}

// ── One-time tokens ─────────────────────────────────────────────────────────

type TokenPurpose = "email-verification" | "password-reset";

async function issueToken(purpose: TokenPurpose, userId: string, ttlMs: number): Promise<string> {
  const token = generateToken();
  const identifier = `${purpose}:${userId}`;
  await db.$transaction([
    // Only the newest link of each kind stays valid.
    db.verification.deleteMany({ where: { identifier } }),
    db.verification.create({
      data: { identifier, value: hashToken(token), expiresAt: new Date(Date.now() + ttlMs) },
    }),
  ]);
  return token;
}

/** Consumes a token (single use). Returns the user id or throws. */
async function consumeToken(purpose: TokenPurpose, token: string): Promise<string> {
  const record = await db.verification.findFirst({ where: { value: hashToken(token) } });
  if (!record || !record.identifier.startsWith(`${purpose}:`)) {
    throw new AuthError("invalid-token", "Linkul nu este valid.");
  }
  await db.verification.delete({ where: { id: record.id } });
  if (record.expiresAt.getTime() < Date.now())
    throw new AuthError("invalid-token", "Linkul a expirat.");
  return record.identifier.slice(purpose.length + 1);
}

export function createEmailVerificationToken(userId: string) {
  return issueToken("email-verification", userId, EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000);
}

/** Marks the email verified; activates a pending newsletter subscription. */
export async function verifyEmail(token: string) {
  const userId = await consumeToken("email-verification", token);
  const now = new Date();
  return db.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: now },
      select: { id: true, email: true, firstName: true },
    });
    await tx.newsletterSubscriber.updateMany({
      where: { userId, status: "PENDING" },
      data: { status: "ACTIVE", confirmedAt: now },
    });
    return user;
  });
}

/** Returns a reset token for a known email, or null (callers must not reveal which). */
export async function createPasswordResetToken(email: string) {
  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, firstName: true, email: true },
  });
  if (!user) return null;
  return {
    user,
    token: await issueToken("password-reset", user.id, PASSWORD_RESET_MINUTES * 60 * 1000),
  };
}

async function setPassword(userId: string, password: string) {
  const passwordHash = await hashPassword(password);
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  await db.account.deleteMany({ where: { userId, providerId: CREDENTIAL_PROVIDER } });
  await db.account.create({
    data: {
      userId,
      providerId: CREDENTIAL_PROVIDER,
      accountId: user.email,
      password: passwordHash,
    },
  });
}

/** Sets a new password from a reset link and signs out every session. */
export async function resetPassword(token: string, password: string) {
  const userId = await consumeToken("password-reset", token);
  await setPassword(userId, password);
  // A reset link proves control of the inbox, so the email counts as verified.
  await db.user.updateMany({
    where: { id: userId, emailVerifiedAt: null },
    data: { emailVerifiedAt: new Date() },
  });
  await deleteUserSessions(userId);
  return userId;
}

/** Changes the password after checking the current one; keeps only the current session. */
export async function changePassword(
  userId: string,
  currentPassword: string,
  password: string,
  currentSessionId: string,
) {
  const account = await db.account.findFirst({
    where: { userId, providerId: CREDENTIAL_PROVIDER },
    select: { password: true },
  });
  if (!account?.password || !(await verifyPassword(account.password, currentPassword))) {
    throw new AuthError("wrong-password", "Parola actuală nu este corectă.");
  }
  await setPassword(userId, password);
  await deleteUserSessions(userId, currentSessionId);
}
