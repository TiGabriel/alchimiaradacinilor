import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  blend,
  BUILTIN_PRESETS,
  checkContrast,
  contrastRatio,
  DEFAULT_PALETTE,
  failingPairs,
  PALETTE_KEYS,
  PALETTE_TOKENS,
  paletteCss,
  paletteVariables,
  PHOTO_BACKDROP,
  productPhotoMatrix,
} from "./palette";

describe("site palette", () => {
  it("defaults are the token values in globals.css", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    for (const key of PALETTE_KEYS) {
      const { css: name, value } = PALETTE_TOKENS[key];
      const match = new RegExp(`--color-${name}: *(#[0-9a-fA-F]{6})`).exec(css);
      expect(match?.[1]?.toLowerCase(), name).toBe(value);
    }
  });

  it("computes WCAG contrast ratios", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#ffffff")).toBe(1);
    expect(contrastRatio("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("blends a translucent colour over its background", () => {
    expect(blend("#ffffff", "#000000", 0.5)).toBe("#808080");
    expect(blend("#123456", "#abcdef", 1)).toBe("#123456");
  });

  it("the default palette and every ready-made theme pass all pairs", () => {
    expect(failingPairs(DEFAULT_PALETTE)).toEqual([]);
    for (const preset of BUILTIN_PRESETS)
      expect(failingPairs(preset.colors), preset.id).toEqual([]);
  });

  it("flags pairs that become hard to read", () => {
    const failing = failingPairs({ ...DEFAULT_PALETTE, forest: "#9fc5a8" }).map((r) => r.id);
    expect(failing).toContain("inverse-forest");
    expect(failing).toContain("forest-paper");
    expect(failing).not.toContain("ink-paper");
  });

  it("checks translucent text on its real background", () => {
    const muted = checkContrast(DEFAULT_PALETTE).find((r) => r.id === "inverse-footer-muted")!;
    expect(muted.fgColor).toBe(blend("#f8f4ec", "#213729", 0.7));
  });

  it("writes only the colours that changed", () => {
    expect(paletteCss(DEFAULT_PALETTE)).toBeNull();
    expect(paletteCss({ ...DEFAULT_PALETTE, forest: "#1F4D4F", clay: "#a14e2e" })).toBe(
      ":root{--color-forest:#1f4d4f;--color-clay:#a14e2e}",
    );
  });

  it("tints product photos only when the photo backdrop changes", () => {
    expect(productPhotoMatrix(PHOTO_BACKDROP)).toBeNull();
    expect(productPhotoMatrix(DEFAULT_PALETTE.productBackdrop)).toBeNull();
    expect(productPhotoMatrix("nu e culoare")).toBeNull();
    // #f0e9dc → #eee8e6: each channel scaled so the baked backdrop lands on the new colour.
    const values = productPhotoMatrix("#eee8e6")!.split(" ").map(Number);
    expect(values[0]! * 240).toBeCloseTo(238, 1);
    expect(values[6]! * 233).toBeCloseTo(232, 1);
    expect(values[12]! * 220).toBeCloseTo(230, 1);
    expect(values[18]).toBe(1);
    expect(paletteCss({ ...DEFAULT_PALETTE, productBackdrop: "#eee8e6" })).toBe(
      ":root{--color-product-backdrop:#eee8e6;--product-photo-filter:url(#fundal-produse)}",
    );
  });

  it("never writes something that is not a colour", () => {
    expect(paletteCss({ ...DEFAULT_PALETTE, ink: "red;}body{display:none" })).toBeNull();
  });

  it("exposes every token as a CSS variable for previews", () => {
    const vars = paletteVariables(DEFAULT_PALETTE);
    expect(vars["--color-paper-deep"]).toBe("#f0e9dc");
    expect(Object.keys(vars)).toHaveLength(PALETTE_KEYS.length);
  });
});
