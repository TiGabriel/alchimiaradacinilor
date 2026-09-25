import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { storeImage } from "@/lib/storage";
import { isSettingKey, settingSchemas, type SettingKey } from "@/validation/settings";

import { assertCan, type Actor } from "../auth/permissions";

import { AdminError } from "./errors";

/** Validates against the key's schema (same one used when reading) and stores it. */
export async function saveSetting(actor: Actor, key: string, value: unknown) {
  assertCan(actor, "settings:manage");
  if (!isSettingKey(key)) throw new AdminError("Setare necunoscută.");
  const parsed = settingSchemas[key as SettingKey].parse(value) as Prisma.InputJsonValue;
  await db.siteSetting.upsert({
    where: { key },
    create: { key, value: parsed, updatedById: actor.id },
    update: { value: parsed, updatedById: actor.id },
  });
}

const IMAGE_RULES = {
  logo: { maxDimension: 800, formats: ["png", "webp", "jpeg"] as const },
  hero: { maxDimension: 2400, formats: ["jpeg", "png", "webp", "avif"] as const },
  og: { maxDimension: 1200, formats: ["jpeg", "png", "webp"] as const },
};

/** Uploads a site image (logo, hero, social preview) and returns its public URL and size. */
export async function uploadSiteImage(actor: Actor, purpose: keyof typeof IMAGE_RULES, file: Blob) {
  assertCan(actor, "settings:manage");
  const rules = IMAGE_RULES[purpose];
  const stored = await storeImage(file, {
    folder: "site",
    maxBytes: 5 * 1024 * 1024,
    maxDimension: rules.maxDimension,
    formats: [...rules.formats],
  });
  await db.mediaAsset.create({
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
  return { url: stored.url, width: stored.width, height: stored.height };
}
