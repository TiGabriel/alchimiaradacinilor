import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { storeImage } from "@/lib/storage";
import type { SeoInput } from "@/validation/admin/common";

import { can, ForbiddenError, type Actor } from "../auth/permissions";

/**
 * Creates, updates or keeps absent the SeoMeta row of a page. Returns the id to
 * store on the owner (null when nothing is set and no row existed).
 */
export async function upsertSeo(
  tx: Prisma.TransactionClient,
  seoId: string | null,
  seo: SeoInput,
): Promise<string | null> {
  const data = {
    seoTitle: seo.seoTitle ?? null,
    metaDescription: seo.metaDescription ?? null,
    canonicalUrl: seo.canonicalUrl ?? null,
    ogImageId: seo.ogImageId ?? null,
    noIndex: seo.noIndex,
  };
  if (seoId) {
    await tx.seoMeta.update({ where: { id: seoId }, data });
    return seoId;
  }
  const empty =
    !data.seoTitle &&
    !data.metaDescription &&
    !data.canonicalUrl &&
    !data.ogImageId &&
    !data.noIndex;
  if (empty) return null;
  return (await tx.seoMeta.create({ data })).id;
}

/** Social preview image upload (catalog or content editors). */
export async function uploadSeoImage(actor: Actor, file: Blob) {
  if (!can(actor.roles, "catalog:edit") && !can(actor.roles, "content:edit"))
    throw new ForbiddenError("catalog:edit");
  const stored = await storeImage(file, {
    folder: "seo",
    maxBytes: 5 * 1024 * 1024,
    maxDimension: 1200,
    formats: ["jpeg", "png", "webp"],
  });
  const media = await db.mediaAsset.create({
    data: {
      storageKey: stored.key,
      url: stored.url,
      mimeType: stored.mimeType,
      width: stored.width,
      height: stored.height,
      sizeBytes: stored.sizeBytes,
      createdById: actor.id,
    },
  });
  return { id: media.id, url: media.url };
}
