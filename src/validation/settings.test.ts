import { describe, expect, it, vi } from "vitest";

import { isSettingKey, parseSetting, settingDefaults, settingSchemas } from "./settings";

describe("site settings registry", () => {
  it("has valid defaults for every key", () => {
    for (const key of Object.keys(settingSchemas) as Array<keyof typeof settingSchemas>) {
      expect(settingSchemas[key].safeParse(settingDefaults[key]).success).toBe(true);
    }
  });

  it("recognises known keys only", () => {
    expect(isSettingKey("brand")).toBe(true);
    expect(isSettingKey("toString")).toBe(false);
  });

  it("falls back to the default for invalid stored values", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseSetting("shipping", { flatFee: -1 })).toEqual(settingDefaults.shipping);
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
});
