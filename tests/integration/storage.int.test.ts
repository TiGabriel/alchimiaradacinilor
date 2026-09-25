import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { readLocalObject } from "@/lib/storage/local";
import { storage, StorageError, storeImage } from "@/lib/storage";

async function photoWithMetadata() {
  return sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#7a8f6a" } })
    .jpeg()
    .withExif({ IFD0: { Artist: "Ana Pop", ImageDescription: "Acasă" } })
    .toBuffer();
}

describe("storeImage (local driver)", () => {
  it("re-encodes to WebP, strips metadata and limits dimensions", async () => {
    const input = await photoWithMetadata();
    expect((await sharp(input).metadata()).exif).toBeDefined();

    const stored = await storeImage(new Blob([new Uint8Array(input)]), {
      folder: "reviews",
      maxBytes: 5 * 1024 * 1024,
      maxDimension: 1600,
    });
    try {
      expect(stored).toMatchObject({ mimeType: "image/webp", width: 1600 });
      expect(stored.url).toMatch(/^\/uploads\/reviews\/\d{4}\/\d{2}\/[\w-]+\.webp$/);
      const saved = await readLocalObject(stored.key);
      const meta = await sharp(saved!).metadata();
      expect(meta.format).toBe("webp");
      expect(meta.exif).toBeUndefined();
    } finally {
      await storage().delete(stored.key);
    }
    expect(await readLocalObject(stored.key)).toBeNull();
  });

  it("rejects files that are not images, whatever their declared type", async () => {
    const fake = new Blob(['<svg onload="alert(1)"></svg>'], { type: "image/png" });
    await expect(
      storeImage(fake, { folder: "reviews", maxBytes: 1024 * 1024, maxDimension: 1600 }),
    ).rejects.toBeInstanceOf(StorageError);
  });

  it("rejects oversized files before reading them", async () => {
    await expect(
      storeImage(new Blob([new Uint8Array(2048)]), {
        folder: "reviews",
        maxBytes: 1024,
        maxDimension: 100,
      }),
    ).rejects.toThrow("cel mult");
  });
});
