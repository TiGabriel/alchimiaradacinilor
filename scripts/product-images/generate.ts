/**
 * Product photography: the real product in a generated environment.
 *
 *   pnpm images:products --prepare            # inputs + prompts only, no API call
 *   pnpm images:products                      # generate every missing image
 *   pnpm images:products --only lavender,lemon --force
 *   pnpm images:products --studio             # no AI: product on a paper backdrop
 *
 * Reads the originals in SOURCE_DIR (never writes there). --prepare writes the
 * model inputs (product in place, edit mask, prompt) to WORK_DIR for review.
 * Generation needs OPENAI_API_KEY; the model paints only the environment and
 * the original product pixels are composited back on top, so the bottle, cap,
 * label and logo in the result are exactly those of the source image. Output:
 * OUTPUT_DIR/<ProductName>_<Quantity>_2000x2000.webp, then upload it to the
 * product in Admin → Produse → Imagini.
 *
 * --studio needs no API key: the original product on a seamless warm-paper
 * backdrop with a soft shadow, same placement, to OUTPUT_DIR/studio/.
 */
import "dotenv/config";

import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { composeFinal, composeStudio, encodeWebp, prepareInputs } from "./compose";
import {
  buildPrompt,
  CANVAS,
  OUTPUT_DIR,
  outputFilename,
  parseSourceFilename,
  PRODUCT_PHOTOS,
  SKIPPED_SOURCES,
  SOURCE_DIR,
  WORK_DIR,
  type ProductPhoto,
} from "./manifest";

const API_URL = "https://api.openai.com/v1/images/edits";
const MODEL = process.env.PRODUCT_IMAGE_MODEL || "gpt-image-2.5-sunburst";
const QUALITY = process.env.PRODUCT_IMAGE_QUALITY || "high";

type Options = { prepare: boolean; studio: boolean; force: boolean; only: Set<string> | null };

function parseArgs(argv: string[]): Options {
  const onlyArg = argv.find((a) => a.startsWith("--only"));
  const onlyValue = onlyArg?.includes("=")
    ? onlyArg.split("=")[1]
    : argv[argv.indexOf("--only") + 1];
  return {
    prepare: argv.includes("--prepare"),
    studio: argv.includes("--studio"),
    force: argv.includes("--force"),
    only: onlyArg ? new Set((onlyValue ?? "").split(",").map((s) => s.trim().toLowerCase())) : null,
  };
}

const exists = (file: string) =>
  stat(file).then(
    () => true,
    () => false,
  );

/** Every original is listed in the manifest, and its filename agrees with the entry. */
async function checkSources(): Promise<void> {
  const files = (await readdir(SOURCE_DIR)).filter((f) => /\.(png|webp|jpe?g)$/i.test(f));
  const listed = new Set(PRODUCT_PHOTOS.map((p) => p.source));
  for (const file of files)
    if (SKIPPED_SOURCES[file]) console.log(`skipped   ${file}: ${SKIPPED_SOURCES[file]}`);
    else if (!listed.has(file))
      console.warn(`! ${file} is not in scripts/product-images/manifest.ts — skipped.`);
  for (const photo of PRODUCT_PHOTOS) {
    if (!files.includes(photo.source)) throw new Error(`Missing original: ${photo.source}`);
    const parsed = parseSourceFilename(photo.source);
    if (
      parsed?.name.toLowerCase() !== photo.productName.toLowerCase() ||
      parsed.quantity !== photo.quantity
    )
      throw new Error(`${photo.source}: manifest entry does not match the filename.`);
  }
}

async function generateEnvironment(photo: ProductPhoto, image: Buffer, mask: Buffer) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", buildPrompt(photo));
  form.append("image", new Blob([new Uint8Array(image)], { type: "image/png" }), "input.png");
  form.append("mask", new Blob([new Uint8Array(mask)], { type: "image/png" }), "mask.png");
  form.append("size", `${CANVAS}x${CANVAS}`);
  form.append("quality", QUALITY);
  form.append("background", "opaque");
  form.append("output_format", "png");
  form.append("n", "1");

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  const body = (await response.json().catch(() => null)) as {
    data?: Array<{ b64_json?: string }>;
    error?: { message?: string };
  } | null;
  const b64 = body?.data?.[0]?.b64_json;
  if (!response.ok || !b64)
    throw new Error(`Image API ${response.status}: ${body?.error?.message ?? "no image returned"}`);
  return Buffer.from(b64, "base64");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await checkSources();

  const photos = PRODUCT_PHOTOS.filter(
    (p) => !options.only || options.only.has(p.productName.toLowerCase()),
  );
  if (!photos.length) throw new Error("No product matches --only.");

  if (!options.prepare && !options.studio && !process.env.OPENAI_API_KEY) {
    console.error(
      "OPENAI_API_KEY is not set, so no images were generated.\n" +
        "Add it to .env (see .env.example), run with --prepare to write the inputs and prompts,\n" +
        "or with --studio for photos on a plain paper backdrop (no API needed).",
    );
    process.exitCode = 1;
    return;
  }

  let failed = 0;
  for (const photo of photos) {
    const outputDir = options.studio ? path.join(OUTPUT_DIR, "studio") : OUTPUT_DIR;
    const output = path.join(outputDir, outputFilename(photo.productName, photo.quantity));
    const source = await readFile(path.join(SOURCE_DIR, photo.source));

    if (options.studio) {
      if (!options.force && (await exists(output))) {
        console.log(`exists    ${output} (use --force to redo)`);
        continue;
      }
      const webp = await encodeWebp(await composeStudio(source));
      await mkdir(outputDir, { recursive: true });
      await writeFile(output, webp);
      console.log(`studio    ${output} (${Math.round(webp.length / 1024)} KB)`);
      continue;
    }

    const { image, mask } = await prepareInputs(source);
    if (options.prepare) {
      const dir = path.join(WORK_DIR, photo.productName);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, "input.png"), image);
      await writeFile(path.join(dir, "mask.png"), mask);
      await writeFile(path.join(dir, "prompt.txt"), `${buildPrompt(photo)}\n`);
      console.log(`prepared  ${photo.source} → ${dir}`);
      continue;
    }

    if (!options.force && (await exists(output))) {
      console.log(`exists    ${output} (use --force to regenerate)`);
      continue;
    }
    try {
      const environment = await generateEnvironment(photo, image, mask);
      const webp = await encodeWebp(await composeFinal(environment, source));
      await mkdir(OUTPUT_DIR, { recursive: true });
      await writeFile(output, webp);
      console.log(`generated ${output} (${Math.round(webp.length / 1024)} KB)`);
    } catch (error) {
      failed++;
      console.error(`failed    ${photo.source}: ${(error as Error).message}`);
    }
  }
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error((error as Error).message);
  process.exitCode = 1;
});
