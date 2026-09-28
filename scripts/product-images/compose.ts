/**
 * Image steps around the generator. The real product is never regenerated: the
 * model only paints the environment, and `composeFinal` puts the original
 * product pixels back on top at the exact place they were given to the model.
 */
import sharp from "sharp";

import { CANVAS, LAYOUT } from "./manifest";

/** Flat backdrop behind the product in the image sent to the model (paper-deep). */
const BACKDROP = { r: 240, g: 233, b: 220 };
/** Alpha above which a source pixel counts as part of the product. */
const ALPHA_THRESHOLD = 8;

export type Box = { left: number; top: number; width: number; height: number };
export type Placement = Box & { scale: number };

/** Bounding box of the product's visible pixels in a transparent cut-out. */
export async function productBox(source: Buffer): Promise<Box> {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[y * info.width + x]! > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("The source image has no visible product (fully transparent).");
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

/**
 * Same scale and baseline for every product, centred. One scale for all keeps
 * real sizes (a 5 ml bottle stays smaller than a 15 ml one); it only ever
 * scales down, so the label is never softened.
 */
export function placement(box: Box): Placement {
  const { scale } = LAYOUT;
  const width = Math.round(box.width * scale);
  const height = Math.round(box.height * scale);
  return {
    scale,
    width,
    height,
    left: Math.round((CANVAS - width) / 2),
    top: LAYOUT.baseline - height,
  };
}

/** The product cut-out, cropped to its box and scaled to its place (RGBA PNG). */
export async function placedProduct(source: Buffer): Promise<{ png: Buffer; at: Placement }> {
  const { height } = await sharp(source).metadata();
  if (height !== LAYOUT.sourceHeight)
    throw new Error(
      `Expected a ${LAYOUT.sourceHeight}px tall product image (the producer's scale), ` +
        `got ${height}px.`,
    );
  const box = await productBox(source);
  const at = placement(box);
  const png = await sharp(source)
    .ensureAlpha()
    .extract(box)
    .resize(at.width, at.height, { kernel: "lanczos3", fit: "fill" })
    .png()
    .toBuffer();
  return { png, at };
}

/**
 * What the model receives: the product in place on a flat backdrop, and a mask
 * that is opaque over the product (keep) and transparent everywhere else (paint).
 */
export async function prepareInputs(
  source: Buffer,
): Promise<{ image: Buffer; mask: Buffer; at: Placement }> {
  const { png, at } = await placedProduct(source);
  const image = await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 3, background: BACKDROP },
  })
    .composite([{ input: png, left: at.left, top: at.top }])
    .png()
    .toBuffer();

  const alpha = await sharp(png)
    .extractChannel(3)
    .threshold(ALPHA_THRESHOLD)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const keep = await sharp({
    create: { width: at.width, height: at.height, channels: 3, background: "#000" },
  })
    .joinChannel(alpha.data, { raw: { width: at.width, height: at.height, channels: 1 } })
    .png()
    .toBuffer();
  const mask = await sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: keep, left: at.left, top: at.top }])
    .png()
    .toBuffer();

  return { image, mask, at };
}

/**
 * The generated environment (resized to the canvas if the model returned
 * another size) with the original product composited back at its place.
 * Returns a lossless PNG; encode it with `encodeWebp`.
 */
export async function composeFinal(generated: Buffer, source: Buffer): Promise<Buffer> {
  const { png, at } = await placedProduct(source);
  const background = await sharp(generated)
    .resize(CANVAS, CANVAS, { fit: "cover", kernel: "lanczos3" })
    .removeAlpha()
    .png()
    .toBuffer();
  return sharp(background)
    .composite([{ input: png, left: at.left, top: at.top }])
    .png()
    .toBuffer();
}

/**
 * A studio shot without any generated content: the original product on a
 * seamless warm-paper sweep (brand `paper` → `paper-deep`) with a soft contact
 * shadow, light from the upper left like the product's own highlights.
 * Returns a lossless PNG; encode it with `encodeWebp`.
 */
export async function composeStudio(source: Buffer): Promise<Buffer> {
  const { png, at } = await placedProduct(source);
  const backdrop = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}">
      <defs>
        <radialGradient id="light" cx="42%" cy="38%" r="75%">
          <stop offset="0" stop-color="#fbf8f2"/>
          <stop offset="0.55" stop-color="#f5efe4"/>
          <stop offset="1" stop-color="#ebe2d2"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#light)"/>
    </svg>`,
  );
  const cx = at.left + at.width / 2;
  const base = at.top + at.height;
  // A wide, soft pool of shade falling to the lower right, and a tight contact line.
  const shadow = (rx: number, ry: number, dx: number, opacity: number, blur: number) =>
    sharp(
      Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS}" height="${CANVAS}">
          <ellipse cx="${cx + dx}" cy="${base - ry * 0.35}" rx="${rx}" ry="${ry}"
            fill="rgb(45,38,28)" fill-opacity="${opacity}"/>
        </svg>`,
      ),
    )
      .blur(blur)
      .png()
      .toBuffer();

  return sharp(backdrop)
    .composite([
      { input: await shadow(at.width * 0.78, 46, 70, 0.16, 38) },
      { input: await shadow(at.width * 0.56, 18, 18, 0.32, 12) },
      { input: await shadow(at.width * 0.47, 7, 4, 0.45, 3) },
      { input: png, left: at.left, top: at.top },
    ])
    .png()
    .toBuffer();
}

/** Web delivery: WebP, high quality, sRGB, no metadata (sharp drops it by default). */
export function encodeWebp(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .toColourspace("srgb")
    .webp({ quality: 90, effort: 6, smartSubsample: true })
    .toBuffer();
}
