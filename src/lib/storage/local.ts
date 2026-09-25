import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { STORAGE_KEY_PATTERN } from "../images";

import type { StorageDriver } from "./types";

/**
 * Files on the server's disk, served by the `/uploads/[...key]` route. Fine for
 * development and a single self-hosted server; use S3 on serverless platforms
 * (their filesystem is ephemeral).
 */
export const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");

function resolveKey(key: string): string {
  if (!STORAGE_KEY_PATTERN.test(key)) throw new Error(`Invalid storage key: ${key}`);
  return path.join(LOCAL_UPLOAD_DIR, ...key.split("/"));
}

export const localStorageDriver: StorageDriver = {
  name: "local",
  async put(key, body) {
    const file = resolveKey(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body, { flag: "wx" });
    return { key, url: this.url(key) };
  },
  async delete(key) {
    await rm(resolveKey(key), { force: true });
  },
  url(key) {
    return `/uploads/${key}`;
  },
};

export async function readLocalObject(key: string): Promise<Uint8Array | null> {
  try {
    return await readFile(resolveKey(key));
  } catch {
    return null;
  }
}
