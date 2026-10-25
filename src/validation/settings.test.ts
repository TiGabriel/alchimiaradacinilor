import { describe, expect, it, vi } from "vitest";

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
});
