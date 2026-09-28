import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  composeFinal,
  encodeWebp,
  placement,
  prepareInputs,
} from "../../scripts/product-images/compose";
import {
  buildPrompt,
  CANVAS,
  CROP_SAFE,
  LAYOUT,
  matchesFilename,
  outputFilename,
  parseSourceFilename,
  PRODUCT_PHOTOS,
} from "../../scripts/product-images/manifest";

describe("parseSourceFilename", () => {
  it("reads a name with the quantity glued to it", () => {
    expect(parseSourceFilename("lavender15ml-large-500x1350-eu.png")).toEqual({
      name: "lavender",
      quantity: "15ml",
    });
    expect(parseSourceFilename("wildorange15ml-large-500x1350-eu.png")).toEqual({
      name: "wildorange",
      quantity: "15ml",
    });
  });

  it("keeps hyphenated names whole", () => {
    expect(parseSourceFilename("air-x_15ml_large_1720x1350.png")).toEqual({
      name: "air-x",
      quantity: "15ml",
    });
    expect(parseSourceFilename("abode-15ml-large-1720x1350.png")).toEqual({
      name: "abode",
      quantity: "15ml",
    });
    expect(parseSourceFilename("cinnamon5ml-large-404x1350-eu.png")).toEqual({
      name: "cinnamon",
      quantity: "5ml",
    });
  });

  it("reads a name followed by the quantity", () => {
    expect(parseSourceFilename("Lavanda_10ml.png")).toEqual({ name: "Lavanda", quantity: "10ml" });
    expect(parseSourceFilename("Portocala_15ml.png")).toEqual({
      name: "Portocala",
      quantity: "15ml",
    });
    expect(parseSourceFilename("Menta-5 ML.webp")).toEqual({ name: "Menta", quantity: "5ml" });
  });

  it("does not guess when the name or the quantity is missing", () => {
    expect(parseSourceFilename("lavender.png")).toBeNull();
    expect(parseSourceFilename("15ml.png")).toBeNull();
    expect(parseSourceFilename("IMG_2041.jpg")).toBeNull();
    expect(parseSourceFilename("1103.webp")).toBeNull();
    expect(parseSourceFilename("air-x.jpg")).toBeNull();
  });
});

describe("outputFilename", () => {
  it("follows <ProductName>_<Quantity>_2000x2000.webp", () => {
    expect(outputFilename("Lavanda", "10ml")).toBe("Lavanda_10ml_2000x2000.webp");
    expect(outputFilename("WildOrange", "15ml")).toBe("WildOrange_15ml_2000x2000.webp");
  });
});

describe("PRODUCT_PHOTOS", () => {
  it("takes every name and quantity from its filename, without inventing any", () => {
    for (const photo of PRODUCT_PHOTOS) expect(matchesFilename(photo), photo.source).toBe(true);
  });

  it("names products without a quantity after the filename's first word", () => {
    const roam = { source: "roam-diffuser-large-852x1350-eu.png", productName: "Roam" };
    expect(matchesFilename({ ...roam, quantity: null })).toBe(true);
    expect(matchesFilename({ ...roam, productName: "Lumo", quantity: null })).toBe(false);
    // A filename that carries a quantity must use it.
    expect(
      matchesFilename({ source: "lemon15ml-x.png", productName: "Lemon", quantity: null }),
    ).toBe(false);
    expect(outputFilename("Roam", null)).toBe("Roam_2000x2000.webp");
  });

  it("gives every image its own source, output and product", () => {
    const unique = (values: unknown[]) => new Set(values).size === values.length;
    expect(unique(PRODUCT_PHOTOS.map((p) => p.source))).toBe(true);
    expect(unique(PRODUCT_PHOTOS.map((p) => outputFilename(p.productName, p.quantity)))).toBe(true);
    const slugs = PRODUCT_PHOTOS.map((p) => p.productSlug).filter(Boolean);
    expect(unique(slugs)).toBe(true);
  });

  it("shares one photography direction and adds the product's own scene", () => {
    const [a, b] = PRODUCT_PHOTOS;
    const shared = buildPrompt(a!).split("\n\n")[0];
    expect(buildPrompt(b!).split("\n\n")[0]).toBe(shared);
    expect(buildPrompt(a!)).toContain(a!.scene);
  });
});

describe("placement", () => {
  // Product boxes in the real 1350 px originals: 15 ml bottles and the 5 ml one.
  const fifteen = { left: 0, top: 14, width: 517, height: 1319 };
  const five = { left: 0, top: 300, width: 404, height: 1050 };

  it("puts every product on the same baseline, centred, inside every site crop", () => {
    for (const box of [fifteen, { left: 3, top: 21, width: 496, height: 1302 }, five]) {
      const at = placement(box);
      expect(at.top + at.height).toBe(LAYOUT.baseline);
      expect(Math.abs(at.left + at.width / 2 - CANVAS / 2)).toBeLessThanOrEqual(1);
      expect(at.left).toBeGreaterThanOrEqual(CROP_SAFE.left);
      expect(at.left + at.width).toBeLessThanOrEqual(CROP_SAFE.right);
      expect(at.top).toBeGreaterThanOrEqual(CROP_SAFE.top);
      expect(at.top + at.height).toBeLessThanOrEqual(CROP_SAFE.bottom);
    }
  });

  it("keeps real sizes: one scale, never enlarged, a 5 ml bottle smaller than 15 ml", () => {
    expect(LAYOUT.scale).toBeLessThanOrEqual(1);
    expect(placement(five).height).toBeLessThan(placement(fifteen).height);
    expect(placement(fifteen).height).toBe(Math.round(fifteen.height * LAYOUT.scale));
  });
});

/** A 500×1350 cut-out: a two-colour "bottle" on a transparent canvas. */
async function syntheticSource() {
  const bottle = await sharp({
    create: {
      width: 400,
      height: 1300,
      channels: 4,
      background: { r: 90, g: 50, b: 20, alpha: 1 },
    },
  })
    .composite([
      {
        input: await sharp({
          create: { width: 300, height: 500, channels: 4, background: "#b98ce0" },
        })
          .png()
          .toBuffer(),
        left: 50,
        top: 600,
      },
    ])
    .png()
    .toBuffer();
  return sharp({
    create: { width: 500, height: 1350, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: bottle, left: 50, top: 25 }])
    .png()
    .toBuffer();
}

describe("compose", () => {
  it("masks the product (kept) and leaves the rest to be painted", async () => {
    const { image, mask, at } = await prepareInputs(await syntheticSource());
    for (const buffer of [image, mask]) {
      const meta = await sharp(buffer).metadata();
      expect([meta.width, meta.height]).toEqual([CANVAS, CANVAS]);
    }
    const { data, info } = await sharp(mask).raw().toBuffer({ resolveWithObject: true });
    const alphaAt = (x: number, y: number) => data[(y * info.width + x) * info.channels + 3];
    const centre = [
      Math.floor(at.left + at.width / 2),
      Math.floor(at.top + at.height / 2),
    ] as const;
    expect(alphaAt(...centre)).toBe(255);
    expect(alphaAt(100, 100)).toBe(0);
  });

  it("puts the original product pixels back over whatever the model returns", async () => {
    const source = await syntheticSource();
    const { image, at } = await prepareInputs(source);
    // A "model output" that also repainted the product area.
    const generated = await sharp({
      create: { width: 1024, height: 1024, channels: 3, background: "#3a7d44" },
    })
      .png()
      .toBuffer();
    const final = await composeFinal(generated, source);

    const read = (buffer: Buffer) =>
      sharp(buffer)
        .removeAlpha()
        .extract({
          left: at.left + 20,
          top: at.top + 20,
          width: at.width - 40,
          height: at.height - 40,
        })
        .raw()
        .toBuffer();
    expect((await read(final)).equals(await read(image))).toBe(true);

    const webp = await encodeWebp(final);
    const meta = await sharp(webp).metadata();
    expect(meta).toMatchObject({ format: "webp", width: CANVAS, height: CANVAS });
    expect(meta.exif).toBeUndefined();
    expect(meta.icc).toBeUndefined();
  });
});
