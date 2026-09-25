import "server-only";
import { randomBytes } from "node:crypto";

import sharp, { type OutputInfo } from "sharp";

import { env, type ServerEnv } from "../env";
import {
  imageStorageKey,
  imageTooLargeMessage,
  validateImageUpload,
  type ImageRules,
} from "../images";

import { localStorageDriver } from "./local";
import { s3StorageDriver } from "./s3";
import type { StorageDriver } from "./types";

export type { StorageDriver, StoredObject } from "./types";

export class StorageError extends Error {}

export function resolveStorage(config: ServerEnv): StorageDriver {
  if (config.STORAGE_DRIVER === "local") return localStorageDriver;
  const missing = (
    ["S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY", "S3_PUBLIC_URL"] as const
  ).filter((k) => !config[k]);
  if (missing.length)
    throw new StorageError(`Stocarea S3 nu este configurată: ${missing.join(", ")}.`);
  return s3StorageDriver({
    endpoint: config.S3_ENDPOINT,
    region: config.S3_REGION!,
    bucket: config.S3_BUCKET!,
    accessKeyId: config.S3_ACCESS_KEY_ID!,
    secretAccessKey: config.S3_SECRET_ACCESS_KEY!,
    publicUrl: config.S3_PUBLIC_URL!,
  });
}

export function storage(): StorageDriver {
  return resolveStorage(env());
}

export type StoredImage = {
  key: string;
  url: string;
  mimeType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
};

/**
 * Validates an uploaded image (by its bytes), then re-encodes it to WebP:
 * applies the EXIF orientation, strips all metadata (location, camera…),
 * limits the dimensions and guards against decompression bombs.
 */
export async function storeImage(
  file: Blob,
  options: ImageRules & { folder: string; maxDimension: number },
): Promise<StoredImage> {
  // Checked before reading the body into memory.
  if (file.size > options.maxBytes) throw new StorageError(imageTooLargeMessage(options.maxBytes));
  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = validateImageUpload(bytes, options);
  if (!check.ok) throw new StorageError(check.error);

  let output: { data: Buffer; info: OutputInfo };
  try {
    output = await sharp(bytes, { limitInputPixels: 40_000_000, failOn: "error" })
      .rotate()
      .resize({
        width: options.maxDimension,
        height: options.maxDimension,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new StorageError("Imaginea nu a putut fi citită. Încearcă alt fișier.");
  }

  const key = imageStorageKey(options.folder, randomBytes(12).toString("base64url"));
  const stored = await storage().put(key, output.data, "image/webp");
  return {
    ...stored,
    mimeType: "image/webp",
    width: output.info.width,
    height: output.info.height,
    sizeBytes: output.info.size,
  };
}
