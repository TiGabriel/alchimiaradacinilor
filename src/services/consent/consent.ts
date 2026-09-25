import "server-only";

import type { ConsentPurpose } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { getSetting } from "@/services/settings";

import { latestConsents } from "./latest";

export type ConsentMeta = { source: string; ipHash?: string | null; userAgent?: string | null };

type Tx = Prisma.TransactionClient;

/** Appends a consent record (records are never updated or deleted). */
export async function recordConsent(
  input: {
    userId?: string | null;
    subscriberId?: string | null;
    purpose: ConsentPurpose;
    granted: boolean;
  },
  meta: ConsentMeta,
  tx: Tx = db,
) {
  const { privacyPolicyVersion } = await getSetting("legal");
  return tx.consentRecord.create({
    data: {
      userId: input.userId ?? null,
      subscriberId: input.subscriberId ?? null,
      purpose: input.purpose,
      granted: input.granted,
      policyVersion: privacyPolicyVersion,
      source: meta.source,
      ipHash: meta.ipHash ?? null,
      userAgent: meta.userAgent?.slice(0, 300) ?? null,
    },
  });
}

export async function getUserConsents(userId: string) {
  const records = await db.consentRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { purpose: true, granted: true, createdAt: true, policyVersion: true, source: true },
  });
  return { records, latest: latestConsents(records) };
}

export type NewsletterState = {
  subscribed: boolean;
  status: "ACTIVE" | "PENDING" | "UNSUBSCRIBED" | "NONE";
  consentedAt: Date | null;
  withdrawnAt: Date | null;
};

export async function getNewsletterState(userId: string): Promise<NewsletterState> {
  const [subscriber, { latest }] = await Promise.all([
    db.newsletterSubscriber.findUnique({ where: { userId } }),
    getUserConsents(userId),
  ]);
  const consent = latest.get("NEWSLETTER");
  return {
    subscribed: subscriber?.status === "ACTIVE",
    status: subscriber?.status ?? "NONE",
    consentedAt: consent?.granted ? consent.createdAt : null,
    withdrawnAt: consent && !consent.granted ? consent.createdAt : null,
  };
}

/**
 * Grants or withdraws email-marketing consent for a signed-in user. The change
 * is recorded as a new ConsentRecord and mirrored on the subscriber row.
 * A verified account's email counts as confirmed (no second opt-in email).
 */
export async function setNewsletterConsent(userId: string, granted: boolean, meta: ConsentMeta) {
  await db.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, emailVerifiedAt: true },
    });
    const now = new Date();
    const subscriber = await tx.newsletterSubscriber.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        userId,
        source: meta.source,
        status: granted ? (user.emailVerifiedAt ? "ACTIVE" : "PENDING") : "UNSUBSCRIBED",
        confirmedAt: granted && user.emailVerifiedAt ? now : null,
        unsubscribedAt: granted ? null : now,
      },
      update: granted
        ? {
            userId,
            status: user.emailVerifiedAt ? "ACTIVE" : "PENDING",
            confirmedAt: user.emailVerifiedAt ? now : null,
            unsubscribedAt: null,
          }
        : { userId, status: "UNSUBSCRIBED", unsubscribedAt: now },
    });
    await recordConsent(
      { userId, subscriberId: subscriber.id, purpose: "NEWSLETTER", granted },
      meta,
      tx,
    );
  });
}

export async function setPersonalizationConsent(
  userId: string,
  granted: boolean,
  meta: ConsentMeta,
) {
  await recordConsent({ userId, purpose: "PERSONALIZATION", granted }, meta);
}

export async function hasPersonalizationConsent(userId: string): Promise<boolean> {
  const { latest } = await getUserConsents(userId);
  return latest.get("PERSONALIZATION")?.granted ?? false;
}
