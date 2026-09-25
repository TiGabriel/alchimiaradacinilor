/** Campaign audience → Prisma filter. Pure (no db import) and unit-tested. */
import type { Prisma } from "@/generated/prisma/client";
import type { CampaignSegment } from "@/validation/newsletter";

/** Only ACTIVE subscribers ever receive campaigns (status is kept in sync with consent). */
export function segmentWhere(segment: CampaignSegment): Prisma.NewsletterSubscriberWhereInput {
  const and: Prisma.NewsletterSubscriberWhereInput[] = [{ status: "ACTIVE" }];
  if (segment.interests?.length) and.push({ interests: { hasSome: segment.interests } });
  if (segment.sources?.length) and.push({ source: { in: segment.sources } });
  if (segment.customersOnly)
    and.push({ user: { orders: { some: { status: { notIn: ["CANCELLED", "REFUNDED"] } } } } });
  if (segment.confirmedSince)
    and.push({ confirmedAt: { gte: new Date(`${segment.confirmedSince}T00:00:00Z`) } });
  return { AND: and };
}

/** Human summary shown in the admin before sending. */
export function describeSegment(segment: CampaignSegment): string {
  const parts: string[] = [];
  if (segment.interests?.length) parts.push(`interese: ${segment.interests.join(", ")}`);
  if (segment.sources?.length) parts.push(`sursă: ${segment.sources.join(", ")}`);
  if (segment.customersOnly) parts.push("doar clienți cu comenzi");
  if (segment.confirmedSince) parts.push(`confirmați din ${segment.confirmedSince}`);
  return parts.length ? `Abonați activi — ${parts.join("; ")}` : "Toți abonații activi";
}
