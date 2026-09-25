import { describe, expect, it } from "vitest";

import {
  imageStorageKey,
  sniffImageFormat,
  STORAGE_KEY_PATTERN,
  validateImageUpload,
} from "./images";

const bytes = (...parts: Array<number[] | string>) =>
  new Uint8Array(
    parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)),
  );
const pad = (b: Uint8Array, length = 64) => {
  const out = new Uint8Array(length);
  out.set(b);
  return out;
};

const jpeg = pad(bytes([0xff, 0xd8, 0xff, 0xe0]));
const png = pad(bytes([0x89], "PNG", [0x0d, 0x0a, 0x1a, 0x0a]));
const webp = pad(bytes("RIFF", [0, 0, 0, 0], "WEBP"));
const avif = pad(bytes([0, 0, 0, 0x20], "ftypavif"));
const svg = pad(bytes('<svg xmlns="http://www.w3.org/2000/svg">'));
const gif = pad(bytes("GIF89a"));

describe("sniffImageFormat", () => {
  it("detects formats from magic bytes", () => {
    expect(sniffImageFormat(jpeg)).toBe("jpeg");
    expect(sniffImageFormat(png)).toBe("png");
    expect(sniffImageFormat(webp)).toBe("webp");
    expect(sniffImageFormat(avif)).toBe("avif");
  });

  it("rejects SVG, GIF and truncated files", () => {
    expect(sniffImageFormat(svg)).toBeNull();
    expect(sniffImageFormat(gif)).toBeNull();
    expect(sniffImageFormat(bytes([0xff, 0xd8]))).toBeNull();
  });
});

describe("validateImageUpload", () => {
  it("enforces size and allowed formats", () => {
    expect(validateImageUpload(jpeg, { maxBytes: 1000 })).toEqual({ ok: true, format: "jpeg" });
    expect(validateImageUpload(jpeg, { maxBytes: 10 })).toMatchObject({ ok: false });
    expect(validateImageUpload(new Uint8Array(), { maxBytes: 10 })).toMatchObject({ ok: false });
    expect(validateImageUpload(svg, { maxBytes: 1000 })).toMatchObject({ ok: false });
    expect(validateImageUpload(avif, { maxBytes: 1000, formats: ["jpeg", "png"] })).toMatchObject({
      ok: false,
      error: "Acceptăm doar imagini JPEG, PNG.",
    });
  });
});

describe("storage keys", () => {
  it("builds safe keys that the local route accepts", () => {
    const key = imageStorageKey("../Reviews!", "abc_DEF-1", "webp", new Date("2026-09-25"));
    expect(key).toBe("reviews/2026/09/abc_DEF-1.webp");
    expect(STORAGE_KEY_PATTERN.test(key)).toBe(true);
    expect(STORAGE_KEY_PATTERN.test("../../etc/passwd")).toBe(false);
    expect(STORAGE_KEY_PATTERN.test("reviews/2026/09/../../x.webp")).toBe(false);
  });
});
