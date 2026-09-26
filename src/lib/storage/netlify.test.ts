import { beforeEach, describe, expect, it, vi } from "vitest";

const blobs = new Map<string, { data: ArrayBuffer; metadata?: Record<string, unknown> }>();
const store = {
  set: vi.fn(
    async (key: string, data: ArrayBuffer, opts?: { metadata?: Record<string, unknown> }) => {
      blobs.set(key, { data, metadata: opts?.metadata });
    },
  ),
  get: vi.fn(async (key: string) => blobs.get(key)?.data ?? null),
  delete: vi.fn(async (key: string) => {
    blobs.delete(key);
  }),
};
const getStore = vi.fn((_options: unknown) => store);
vi.mock("@netlify/blobs", () => ({ getStore: (options: unknown) => getStore(options) }));

const { netlifyStorageDriver, readNetlifyObject } = await import("./netlify");

describe("netlifyStorageDriver", () => {
  beforeEach(() => blobs.clear());

  it("stores bytes in the strongly consistent uploads store and serves them from /uploads", async () => {
    const key = "reviews/2026/09/abc_DEF-1.webp";
    const stored = await netlifyStorageDriver.put(key, new Uint8Array([1, 2, 3]), "image/webp");

    expect(stored).toEqual({ key, url: `/uploads/${key}` });
    expect(getStore).toHaveBeenCalledWith({ name: "uploads", consistency: "strong" });
    expect(blobs.get(key)?.metadata).toEqual({ contentType: "image/webp" });
    expect(await readNetlifyObject(key)).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("returns null for missing keys and deletes objects", async () => {
    const key = "products/2026/09/gone.webp";
    await netlifyStorageDriver.put(key, new Uint8Array([9]), "image/webp");
    await netlifyStorageDriver.delete(key);
    expect(await readNetlifyObject(key)).toBeNull();
  });

  it("copies only the view's bytes, not the whole backing buffer", async () => {
    const backing = new Uint8Array([0, 0, 7, 8, 0]);
    await netlifyStorageDriver.put("misc/2026/09/view.webp", backing.subarray(2, 4), "image/webp");
    expect(await readNetlifyObject("misc/2026/09/view.webp")).toEqual(new Uint8Array([7, 8]));
  });
});
