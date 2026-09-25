"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { adminModerateReview } from "@/services/admin/moderation";
import { adminSendCampaign, previewAudience, saveCampaign } from "@/services/admin/newsletter";
import { campaignSegmentSchema } from "@/validation/newsletter";
import { moderationSchema } from "@/validation/review";

import { adminAction } from "../action";

export async function moderateReviewAction(input: unknown) {
  const result = await adminAction("content:edit", async (actor) => {
    const data = moderationSchema.parse(input);
    await adminModerateReview(actor, data);
    return null;
  });
  if (result.ok) revalidatePath("/admin/recenzii");
  return result;
}

export async function saveCampaignAction(input: unknown, id?: string) {
  const target = id ? z.uuid().parse(id) : undefined;
  const result = await adminAction(
    "users:manage",
    async (actor) => ({ id: (await saveCampaign(actor, input, target)).id }),
    "Campania a fost salvată.",
  );
  if (result.ok) revalidatePath("/admin/newsletter");
  return result;
}

export async function previewAudienceAction(segment: unknown) {
  return adminAction("users:manage", (actor) =>
    previewAudience(actor, campaignSegmentSchema.parse(segment)),
  );
}

export async function sendCampaignAction(id: string) {
  const result = await adminAction("users:manage", async (actor) => {
    const sent = await adminSendCampaign(actor, z.uuid().parse(id));
    return { delivered: sent.deliveredCount, failed: sent.failedCount };
  });
  if (result.ok) revalidatePath("/admin/newsletter");
  return result;
}
