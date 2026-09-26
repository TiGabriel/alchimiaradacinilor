import "server-only";
import { getStore } from "@netlify/blobs";

import type { StorageDriver } from "./types";

/**
 * Netlify Blobs (site-wide store), served by the `/uploads/[...key]` route like
 * the local driver. Credentials are injected by Netlify at runtime; strong
 * consistency so a fresh upload is readable at once (the admin previews it).
 */
const uploads = () => getStore({ name: "uploads", consistency: "strong" });

export const netlifyStorageDriver: StorageDriver = {
  name: "netlify",
  async put(key, body, contentType) {
    await uploads().set(key, body.slice().buffer, { metadata: { contentType } });
    return { key, url: this.url(key) };
  },
  async delete(key) {
    await uploads().delete(key);
  },
  url(key) {
    return `/uploads/${key}`;
  },
};

export async function readNetlifyObject(key: string): Promise<Uint8Array | null> {
  const data = await uploads().get(key, { type: "arrayBuffer" });
  return data ? new Uint8Array(data) : null;
}
