/**
 * Image steps around the generator. The real product is never regenerated: the
 * model only paints the environment, and `composeFinal` puts the original
 * product pixels back on top at the exact place they were given to the model.
 */
import sharp, { type OverlayOptions } from "sharp";

import { CANVAS, CROP_SAFE, LAYOUT } from "./manifest";

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

/** Widest a product may be: 80% of the width a 4:5 card keeps, for breathing room. */
const MAX_WIDTH = (CROP_SAFE.right - CROP_SAFE.left) * 0.8;
/** Tallest a product may be: from its baseline up to the top of the 4:3 crop. */
const MAX_HEIGHT = LAYOUT.baseline - CROP_SAFE.top;

/**
 * Same scale and baseline for every product, centred. The producer's scale
 * (LAYOUT.scale for a LAYOUT.sourceHeight frame) keeps real sizes: a 5 ml
 * bottle stays smaller than a 15 ml one. A product that would not fit the
 * site's crops at that scale (a wide keychain, a group of bottles) is scaled
 * down to fit. Never enlarged, so labels are never softened.
 */
export function placement(box: Box, frameHeight: number = LAYOUT.sourceHeight): Placement {
  const scale = Math.min(
    (LAYOUT.scale * LAYOUT.sourceHeight) / frameHeight,
    MAX_WIDTH / box.width,
    MAX_HEIGHT / box.height,
    1,
  );
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
  const box = await productBox(source);
  const at = placement(box, height);
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
  return sharp(STUDIO_BACKDROP)
    .composite([...(await contactShadows(at)), { input: png, left: at.left, top: at.top }])
    .png()
    .toBuffer();
}

/** Seamless warm-paper sweep, lit from the upper left. */
const STUDIO_BACKDROP = Buffer.from(
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

/**
 * A wide, soft pool of shade falling to the lower right and a tight contact
 * line under a product standing at `at`, sized to its width.
 */
async function contactShadows(at: Box): Promise<OverlayOptions[]> {
  const cx = at.left + at.width / 2;
  const base = at.top + at.height;
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
  return [
    { input: await shadow(at.width * 0.78, 46, 70, 0.16, 38) },
    { input: await shadow(at.width * 0.56, 18, 18, 0.32, 12) },
    { input: await shadow(at.width * 0.47, 7, 4, 0.45, 3) },
  ];
}

/** Height, in pixels, of a 15 ml bottle's product box in the producer's 1350 px frame. */
const BOTTLE_15ML_HEIGHT = 1311;

export type KitItem = {
  source: Buffer;
  /** Real height relative to a 15 ml bottle; measured from the photo when omitted. */
  relativeHeight?: number;
};

/**
 * Horizontal positions (in units of a 15 ml bottle's height) for a group of
 * products standing side by side: tallest in the middle, the rest alternating
 * right and left, so the group reads as one composed shot.
 */
export function kitLayout(items: Array<{ width: number; height: number }>, gap: number) {
  const order = items
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => b.height - a.height);
  const row: typeof order = [];
  order.forEach((item, i) => (i % 2 === 0 ? row.push(item) : row.unshift(item)));
  let x = 0;
  const placed = row.map((item) => {
    const at = { index: item.index, x, width: item.width, height: item.height };
    x += item.width + gap;
    return at;
  });
  return { placed, width: x - gap, height: Math.max(...items.map((i) => i.height)) };
}

/**
 * Every product of a kit in one studio shot: the original cut-outs side by
 * side on one baseline, each at its real size relative to the others, the
 * whole group scaled (never enlarged) to fit the site's crops.
 */
export async function composeKit(items: KitItem[]): Promise<Buffer> {
  if (!items.length) throw new Error("A kit photo needs at least one product.");
  const measured = await Promise.all(
    items.map(async (item) => {
      const { height: frame } = await sharp(item.source).metadata();
      const box = await productBox(item.source);
      const relativeHeight =
        item.relativeHeight ?? (box.height * (LAYOUT.sourceHeight / frame!)) / BOTTLE_15ML_HEIGHT;
      return { ...item, box, relativeHeight };
    }),
  );
  // Sizes in bottle units (1 = the height of a 15 ml bottle).
  const units = measured.map((m, index) => ({
    index,
    height: m.relativeHeight,
    width: (m.box.width / m.box.height) * m.relativeHeight,
  }));
  // Up to four products stand in one row. More go in two rows, like a group
  // shot: the taller half in a raised back row, the rest in front of it.
  const byHeight = [...units].sort((a, b) => b.height - a.height);
  const rowItems =
    units.length > 4
      ? [
          byHeight.slice(0, Math.ceil(units.length / 2)),
          byHeight.slice(Math.ceil(units.length / 2)),
        ]
      : [units];
  const lift = rowItems.length > 1 ? KIT_BACK_ROW_LIFT : 0;
  const rows = rowItems.map((row, r) => {
    const layout = kitLayout(row, KIT_GAP);
    return {
      lift: r === 0 ? lift : 0,
      width: layout.width,
      height: layout.height,
      placed: layout.placed.map((p) => ({ ...p, index: row[p.index]!.index })),
    };
  });
  const width = Math.max(...rows.map((r) => r.width));
  const height = Math.max(...rows.map((r) => r.height + r.lift));
  // Pixels per bottle unit: fit the crops, and never enlarge any cut-out.
  const unit = Math.min(
    MAX_WIDTH / width,
    MAX_HEIGHT / height,
    ...measured.map((m) => m.box.height / m.relativeHeight),
  );

  // Back row first, so the front row is drawn over it.
  const layers: OverlayOptions[] = [];
  for (const row of rows) {
    const left0 = (CANVAS - row.width * unit) / 2;
    const baseline = LAYOUT.baseline - Math.round(row.lift * unit);
    const shadows: OverlayOptions[] = [];
    const products: OverlayOptions[] = [];
    for (const p of row.placed) {
      const m = measured[p.index]!;
      const at = {
        left: Math.round(left0 + p.x * unit),
        top: 0,
        width: Math.round(p.width * unit),
        height: Math.round(p.height * unit),
      };
      at.top = baseline - at.height;
      shadows.push(...(await contactShadows(at)));
      const png = await sharp(m.source)
        .ensureAlpha()
        .extract(m.box)
        .resize(at.width, at.height, { kernel: "lanczos3", fit: "fill" })
        .png()
        .toBuffer();
      products.push({ input: png, left: at.left, top: at.top });
    }
    layers.push(...shadows, ...products);
  }
  return sharp(STUDIO_BACKDROP).composite(layers).png().toBuffer();
}

/** Space between products in a row, in bottle units. */
const KIT_GAP = 0.12;
/** How much higher the back row stands than the front row, in bottle units. */
const KIT_BACK_ROW_LIFT = 0.32;

/** Web delivery: WebP, high quality, sRGB, no metadata (sharp drops it by default). */
export function encodeWebp(image: Buffer): Promise<Buffer> {
  return sharp(image)
    .toColourspace("srgb")
    .webp({ quality: 90, effort: 6, smartSubsample: true })
    .toBuffer();
}
