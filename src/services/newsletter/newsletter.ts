import "server-only";

import { emailConfigured, isDelivered, sendEmail } from "@/lib/email";
import { campaignEmail, newsletterConfirmEmail } from "@/lib/email/templates/newsletter";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { getSetting } from "@/services/settings";
import { campaignSegmentSchema } from "@/validation/newsletter";

import { generateToken, hashToken } from "../auth/tokens";
import { recordConsent, type ConsentMeta } from "../consent/consent";

import { segmentWhere } from "./segment";
import { oneClickUnsubscribeUrl, unsubscribeUrl, verifyUnsubscribeSignature } from "./tokens";

export const CONFIRMATION_HOURS = 48;

function secret() {
  return env().AUTH_SECRET ?? "dev-only-secret-change-me-in-production";
}

async function brand() {
  const { siteName } = await getSetting("brand");
  return { siteName, siteUrl: env().APP_URL.replace(/\/$/, "") };
}

export type SubscribeOutcome =
  /** Confirmation email sent (or the address was already active — not revealed to the visitor). */
  | { status: "confirmation-sent" }
  /** No email provider: nothing was stored, the visitor is told honestly. */
  | { status: "unavailable" };

/**
 * Double opt-in: stores a PENDING subscriber with a hashed, expiring token and
 * emails the confirmation link. Consent is recorded only when confirmed.
 * The response never reveals whether an address is already subscribed.
 */
export async function requestSubscription(input: {
  email: string;
  source: string;
  interests?: string[];
}): Promise<SubscribeOutcome> {
  if (!emailConfigured()) return { status: "unavailable" };
  const existing = await db.newsletterSubscriber.findUnique({ where: { email: input.email } });
  if (existing?.status === "ACTIVE") return { status: "confirmation-sent" };

  const token = generateToken();
  const expires = new Date(Date.now() + CONFIRMATION_HOURS * 60 * 60 * 1000);
  const account = await db.user.findUnique({ where: { email: input.email }, select: { id: true } });
  await db.newsletterSubscriber.upsert({
    where: { email: input.email },
    create: {
      email: input.email,
      userId: account?.id ?? null,
      status: "PENDING",
      source: input.source,
      interests: input.interests ?? [],
      confirmTokenHash: hashToken(token),
      confirmTokenExpiresAt: expires,
    },
    update: {
      status: "PENDING",
      source: existing?.source ?? input.source,
      confirmTokenHash: hashToken(token),
      confirmTokenExpiresAt: expires,
      unsubscribedAt: null,
    },
  });
  const b = await brand();
  const url = `${b.siteUrl}/newsletter/confirmare?token=${encodeURIComponent(token)}`;
  const result = await sendEmail({
    to: input.email,
    ...newsletterConfirmEmail({ url, hours: CONFIRMATION_HOURS }, b),
  });
  return isDelivered(result) ? { status: "confirmation-sent" } : { status: "unavailable" };
}

export type ConfirmOutcome = "confirmed" | "already-active" | "invalid";

export async function confirmSubscription(
  token: string,
  meta: ConsentMeta,
): Promise<ConfirmOutcome> {
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(token)) return "invalid";
  const subscriber = await db.newsletterSubscriber.findFirst({
    where: { confirmTokenHash: hashToken(token) },
  });
  if (!subscriber) return "invalid";
  if (subscriber.status === "ACTIVE") return "already-active";
  if (!subscriber.confirmTokenExpiresAt || subscriber.confirmTokenExpiresAt < new Date())
    return "invalid";
  await db.$transaction(async (tx) => {
    const account =
      subscriber.userId ??
      (await tx.user.findUnique({ where: { email: subscriber.email }, select: { id: true } }))
        ?.id ??
      null;
    await tx.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        confirmedAt: new Date(),
        confirmTokenHash: null,
        confirmTokenExpiresAt: null,
        userId: account,
      },
    });
    await recordConsent(
      { userId: account, subscriberId: subscriber.id, purpose: "NEWSLETTER", granted: true },
      meta,
      tx,
    );
  });
  return "confirmed";
}

export type UnsubscribeOutcome = "unsubscribed" | "already" | "invalid";

/** Signed-link unsubscribe; idempotent. Withdrawal is recorded like any consent change. */
export async function unsubscribeWithSignature(
  subscriberId: string,
  signature: string,
  meta: ConsentMeta,
): Promise<UnsubscribeOutcome> {
  if (!verifyUnsubscribeSignature(subscriberId, signature, secret())) return "invalid";
  const subscriber = await db.newsletterSubscriber.findUnique({ where: { id: subscriberId } });
  if (!subscriber) return "invalid";
  if (subscriber.status === "UNSUBSCRIBED") return "already";
  await db.$transaction(async (tx) => {
    await tx.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        confirmTokenHash: null,
        confirmTokenExpiresAt: null,
      },
    });
    await recordConsent(
      {
        userId: subscriber.userId,
        subscriberId: subscriber.id,
        purpose: "NEWSLETTER",
        granted: false,
      },
      meta,
      tx,
    );
  });
  return "unsubscribed";
}

export function subscriberUnsubscribeLinks(subscriberId: string) {
  const base = env().APP_URL;
  return {
    page: unsubscribeUrl(base, subscriberId, secret()),
    oneClick: oneClickUnsubscribeUrl(base, subscriberId, secret()),
  };
}

export class CampaignError extends Error {}

export async function countSegment(segmentJson: unknown) {
  const segment = campaignSegmentSchema.parse(segmentJson ?? {});
  return db.newsletterSubscriber.count({ where: segmentWhere(segment) });
}

/**
 * Sends a DRAFT campaign to its segment. Refuses without a configured email
 * provider; only ACTIVE (confirmed, consenting) subscribers are included and
 * every email carries a one-click unsubscribe link and header.
 */
export async function sendCampaign(campaignId: string) {
  if (!emailConfigured())
    throw new CampaignError(
      "Nu există un furnizor de email configurat. Campania nu a fost trimisă.",
    );
  const campaign = await db.newsletterCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new CampaignError("Campania nu există.");
  const claimed = await db.newsletterCampaign.updateMany({
    where: { id: campaignId, status: "DRAFT" },
    data: { status: "SENDING" },
  });
  if (claimed.count !== 1)
    throw new CampaignError("Campania a fost deja trimisă sau este în curs.");

  const segment = campaignSegmentSchema.parse(campaign.segment ?? {});
  const recipients = await db.newsletterSubscriber.findMany({
    where: segmentWhere(segment),
    select: { id: true, email: true },
  });
  const b = await brand();
  let delivered = 0;
  let failed = 0;
  for (const recipient of recipients) {
    const links = subscriberUnsubscribeLinks(recipient.id);
    const result = await sendEmail({
      to: recipient.email,
      ...campaignEmail({ ...campaign, unsubscribeUrl: links.page }, b),
      headers: {
        "List-Unsubscribe": `<${links.oneClick}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (isDelivered(result)) {
      delivered += 1;
      await db.newsletterSubscriber.update({
        where: { id: recipient.id },
        data: { lastEmailedAt: new Date() },
      });
    } else failed += 1;
  }
  return db.newsletterCampaign.update({
    where: { id: campaignId },
    data: {
      status: delivered === 0 && recipients.length > 0 ? "FAILED" : "SENT",
      sentAt: new Date(),
      recipientCount: recipients.length,
      deliveredCount: delivered,
      failedCount: failed,
    },
  });
}
