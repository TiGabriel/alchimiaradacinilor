/**
 * Upload validation for images — pure and unit-tested. The declared MIME type
 * and file name are never trusted: the format is detected from the bytes.
 */

export type ImageFormat = "jpeg" | "png" | "webp" | "avif";

export const IMAGE_MIME: Record<ImageFormat, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
};

const ascii = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

/** Detects the format from magic bytes; null for anything else (SVG, GIF, HEIC, PDF…). */
export function sniffImageFormat(bytes: Uint8Array): ImageFormat | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (
    bytes[0] === 0x89 &&
    ascii(bytes, 1, 3) === "PNG" &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
    return "png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
  if (ascii(bytes, 4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(bytes, 8, 4))) return "avif";
  return null;
}

export type ImageRules = {
  /** Maximum upload size in bytes. */
  maxBytes: number;
  /** Formats accepted for this upload. */
  formats?: ImageFormat[];
};

export type ImageCheck = { ok: true; format: ImageFormat } | { ok: false; error: string };

const mb = (bytes: number) => `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;

export const imageTooLargeMessage = (maxBytes: number) =>
  `Imaginea poate avea cel mult ${mb(maxBytes)}.`;

export function validateImageUpload(bytes: Uint8Array, rules: ImageRules): ImageCheck {
  if (bytes.length === 0) return { ok: false, error: "Fișierul este gol." };
  if (bytes.length > rules.maxBytes)
    return { ok: false, error: imageTooLargeMessage(rules.maxBytes) };
  const format = sniffImageFormat(bytes);
  const allowed = rules.formats ?? (["jpeg", "png", "webp", "avif"] as ImageFormat[]);
  if (!format || !allowed.includes(format))
    return {
      ok: false,
      error: `Acceptăm doar imagini ${allowed.map((f) => f.toUpperCase()).join(", ")}.`,
    };
  return { ok: true, format };
}

/** Storage key: `<folder>/<yyyy>/<mm>/<random>.<ext>` — never derived from the user's file name. */
export function imageStorageKey(folder: string, random: string, ext = "webp", now = new Date()) {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "misc";
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${safeFolder}/${now.getUTCFullYear()}/${month}/${random}.${ext}`;
}

/** Keys accepted by the local file route (no traversal, known shape). */
export const STORAGE_KEY_PATTERN =
  /^[a-z0-9-]+\/\d{4}\/\d{2}\/[A-Za-z0-9_-]+\.(webp|jpg|png|avif)$/;
