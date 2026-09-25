import "server-only";

import type { Prisma, SubscriberStatus } from "@/generated/prisma/client";
import { toCsv } from "@/lib/csv";
import { db } from "@/lib/db";
import { emailConfigured } from "@/lib/email";
import {
  campaignSchema,
  campaignSegmentSchema,
  type CampaignSegment,
} from "@/validation/newsletter";

import { assertCan, type Actor } from "../auth/permissions";
import { CampaignError, countSegment, sendCampaign } from "../newsletter/newsletter";

import { AdminError } from "./errors";

export type SubscriberFilter = {
  status?: SubscriberStatus;
  q?: string;
  source?: string;
  interest?: string;
  customersOnly?: boolean;
};

function subscriberWhere(f: SubscriberFilter): Prisma.NewsletterSubscriberWhereInput {
  return {
    ...(f.status ? { status: f.status } : {}),
    ...(f.q ? { email: { contains: f.q, mode: "insensitive" } } : {}),
    ...(f.source ? { source: f.source } : {}),
    ...(f.interest ? { interests: { has: f.interest } } : {}),
    ...(f.customersOnly
      ? { user: { orders: { some: { status: { notIn: ["CANCELLED", "REFUNDED"] } } } } }
      : {}),
  };
}

export async function listSubscribers(actor: Actor, filter: SubscriberFilter, take = 200) {
  assertCan(actor, "users:manage");
  const where = subscriberWhere(filter);
  const [total, subscribers, statusCounts, sources] = await Promise.all([
    db.newsletterSubscriber.count({ where }),
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        email: true,
        status: true,
        source: true,
        interests: true,
        confirmedAt: true,
        unsubscribedAt: true,
        createdAt: true,
        userId: true,
      },
    }),
    db.newsletterSubscriber.groupBy({ by: ["status"], _count: true }),
    db.newsletterSubscriber.groupBy({ by: ["source"], _count: true }),
  ]);
  return {
    total,
    subscribers,
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s.status, s._count])),
    sources: sources.map((s) => s.source).filter((s): s is string => Boolean(s)),
  };
}

export async function exportSubscribersCsv(
  actor: Actor,
  filter: SubscriberFilter,
): Promise<string> {
  assertCan(actor, "users:manage");
  const rows = await db.newsletterSubscriber.findMany({
    where: subscriberWhere(filter),
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      status: true,
      source: true,
      interests: true,
      confirmedAt: true,
      unsubscribedAt: true,
      createdAt: true,
    },
  });
  return toCsv(
    ["email", "status", "sursa", "interese", "confirmat", "dezabonat", "creat"],
    rows.map((r) => [
      r.email,
      r.status,
      r.source,
      r.interests.join(" "),
      r.confirmedAt?.toISOString() ?? "",
      r.unsubscribedAt?.toISOString() ?? "",
      r.createdAt.toISOString(),
    ]),
  );
}

export async function listCampaigns(actor: Actor) {
  assertCan(actor, "users:manage");
  return db.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getCampaign(actor: Actor, id: string) {
  assertCan(actor, "users:manage");
  const campaign = await db.newsletterCampaign.findUnique({ where: { id } });
  if (!campaign) return null;
  const segment = campaignSegmentSchema.parse(campaign.segment ?? {});
  return { ...campaign, segment, audience: await countSegment(segment) };
}

export async function saveCampaign(actor: Actor, raw: unknown, id?: string) {
  assertCan(actor, "users:manage");
  const data = campaignSchema.parse(raw);
  if (id) {
    const existing = await db.newsletterCampaign.findUnique({
      where: { id },
      select: { status: true },
    });
    if (existing?.status !== "DRAFT") throw new AdminError("Doar ciornele pot fi modificate.");
    return db.newsletterCampaign.update({
      where: { id },
      data: { ...data, segment: data.segment as Prisma.InputJsonValue },
    });
  }
  return db.newsletterCampaign.create({
    data: { ...data, segment: data.segment as Prisma.InputJsonValue, createdById: actor.id },
  });
}

export async function previewAudience(actor: Actor, segment: CampaignSegment) {
  assertCan(actor, "users:manage");
  return countSegment(campaignSegmentSchema.parse(segment));
}

export async function adminSendCampaign(actor: Actor, id: string) {
  assertCan(actor, "users:manage");
  if (!emailConfigured())
    throw new AdminError("Configurează un furnizor de email înainte de a trimite campanii.");
  try {
    return await sendCampaign(id);
  } catch (error) {
    if (error instanceof CampaignError) throw new AdminError(error.message);
    throw error;
  }
}
