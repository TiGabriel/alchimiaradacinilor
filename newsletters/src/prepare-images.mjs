// Builds the email images (JPG/PNG — email clients don't all support WebP)
// from the real product photos and the site's share image.
// Run from this folder: node prepare-images.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, "../../alchimiaradacinilor/package.json"));
const sharp = require("sharp");
const out = (name) => path.join(here, "../images", name);
const PAPER = { r: 248, g: 244, b: 236 };

// Square crop around the product: zoom = share of the photo width kept,
// cy = vertical centre as a share of the height.
const products = {
  cinnamon: { zoom: 0.76, cy: 0.52 },
  "wild-orange": { zoom: 0.76, cy: 0.52 },
  lavender: { zoom: 0.76, cy: 0.52 },
  lemon: { zoom: 0.76, cy: 0.52 },
  peppermint: { zoom: 0.76, cy: 0.52 },
  abode: { zoom: 0.76, cy: 0.52 },
  "air-x": { zoom: 0.76, cy: 0.52 },
  "difuzor-lumo": { zoom: 0.8, cy: 0.54 },
  "difuzor-roam": { zoom: 0.8, cy: 0.54 },
  "sticlute-roll-on": { zoom: 0.8, cy: 0.54 },
};

for (const [slug, { zoom, cy }] of Object.entries(products)) {
  const src = path.join(here, `${slug}.webp`);
  const { width, height } = await sharp(src).metadata();
  const size = Math.round(width * zoom);
  const left = Math.round((width - size) / 2);
  const top = Math.min(Math.max(0, Math.round(height * cy - size / 2)), height - size);
  await sharp(src)
    .extract({ left, top, width: size, height: size })
    .resize(560, 560)
    .flatten({ background: PAPER })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out(`${slug}.jpg`));
}

// Brand pieces cut from the 1200×630 share image (og-default.png).
const og = path.join(here, "og-default.png");
// Logo: icon + two-line wordmark, side by side, on paper.
const icon = await sharp(og).extract({ left: 92, top: 83, width: 96, height: 96 }).toBuffer();
const word = await sharp(og).extract({ left: 92, top: 215, width: 400, height: 180 }).toBuffer();
await sharp({ create: { width: 560, height: 180, channels: 3, background: PAPER } })
  .composite([
    { input: icon, left: 0, top: 42 },
    { input: word, left: 128, top: 0 },
  ])
  .png()
  .toFile(out("logo.png"));
// Icon alone (footer).
await sharp(og).extract({ left: 92, top: 83, width: 96, height: 96 }).png().toFile(out("icon.png"));
// Botanical line drawing (plant with roots) for the hero.
// Transparent background (lines only), so it sits on any section colour.
{
  const { data, info } = await sharp(og)
    .extract({ left: 830, top: 20, width: 260, height: 590 })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const bg = [data[0], data[1], data[2]];
  const rgba = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const diff = Math.max(...[0, 1, 2].map((k) => Math.abs(data[i + k] - bg[k])));
    // Sage line colour; opacity grows with the distance from the background.
    rgba[j] = 141;
    rgba[j + 1] = 163;
    rgba[j + 2] = 138;
    rgba[j + 3] = Math.min(255, diff * 5);
  }
  await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile(out("plant.png"));
}

console.log("images ready");
