import { describe, expect, it, vi } from "vitest";

import { DEFAULT_PALETTE } from "@/lib/palette";

import { isSettingKey, parseSetting, settingDefaults, settingSchemas } from "./settings";

describe("site settings registry", () => {
  it("has valid defaults for every key", () => {
    for (const key of Object.keys(settingSchemas) as Array<keyof typeof settingSchemas>) {
      expect(settingSchemas[key].safeParse(settingDefaults[key]).success).toBe(true);
    }
  });

  it("only accepts web links for social profiles", () => {
    const social = settingSchemas.social;
    expect(social.safeParse({ facebookUrl: "https://facebook.com/alchimia" }).success).toBe(true);
    expect(social.safeParse({ facebookUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(social.safeParse({ instagramUrl: "data:text/html,x" }).success).toBe(false);
  });

  it("recognises known keys only", () => {
    expect(isSettingKey("brand")).toBe(true);
    expect(isSettingKey("toString")).toBe(false);
  });

  it("falls back to the default for invalid stored values", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseSetting("email", { senderName: 5, replyTo: "nu-e-email" })).toEqual(
      settingDefaults.email,
    );
  });

  it("no longer knows the shop settings (delivery, payment, VAT)", () => {
    expect(isSettingKey("shipping")).toBe(false);
    expect(isSettingKey("payment")).toBe(false);
    expect(isSettingKey("tax")).toBe(false);
  });

  it("accepts an image logo", () => {
    const value = {
      ...settingDefaults.brand,
      logo: {
        kind: "image",
        src: "/logo.svg",
        alt: "Alchimia Rădăcinilor",
        width: 160,
        height: 40,
      },
    };
    expect(parseSetting("brand", value)).toEqual(value);
  });

  it("accepts a readable palette and normalises it", () => {
    const parsed = settingSchemas.theme.parse({
      colors: { ...DEFAULT_PALETTE, forest: "#1F4D4F" },
      presets: [],
    });
    expect(parsed.colors.forest).toBe("#1f4d4f");
  });

  it("refuses colours that are not hex or that fail the contrast check", () => {
    const theme = settingSchemas.theme;
    expect(
      theme.safeParse({ colors: { ...DEFAULT_PALETTE, ink: "red" }, presets: [] }).success,
    ).toBe(false);
    const lowContrast = theme.safeParse({
      colors: { ...DEFAULT_PALETTE, inkMuted: "#c8c4bb" },
      presets: [],
    });
    expect(lowContrast.success).toBe(false);
    expect(lowContrast.error?.issues[0]?.message).toContain("Contrast prea mic");
  });

  it("refuses saved themes that fail the contrast check", () => {
    const result = settingSchemas.theme.safeParse({
      colors: DEFAULT_PALETTE,
      presets: [{ id: "palid", name: "Palid", colors: { ...DEFAULT_PALETTE, ink: "#d0d0d0" } }],
    });
    expect(result.success).toBe(false);
  });

  it("keeps themes saved before the photo backdrop existed", () => {
    const { productBackdrop: _, ...older } = { ...DEFAULT_PALETTE, paperDeep: "#eee8e6" };
    const parsed = settingSchemas.theme.parse({
      colors: older,
      presets: [{ id: "veche", name: "Veche", colors: older }],
    });
    expect(parsed.colors.productBackdrop).toBe("#eee8e6");
    expect(parsed.presets[0]?.colors.productBackdrop).toBe("#eee8e6");
  });
});
