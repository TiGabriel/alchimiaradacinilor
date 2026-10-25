import { describe, expect, it } from "vitest";

import { fillDays, percentChange, rate, shopDay } from "./metrics";

describe("dashboard metrics", () => {
  it("uses the shop's time zone for days", () => {
    expect(shopDay(new Date("2026-09-25T22:30:00Z"))).toBe("2026-09-26");
    expect(shopDay(new Date("2026-09-25T20:00:00Z"))).toBe("2026-09-25");
  });

  it("fills missing days with zeros, oldest first", () => {
    const today = new Date("2026-09-25T12:00:00Z");
    const points = fillDays([{ day: "2026-09-24", count: 2 }], 3, today);
    expect(points).toEqual([
      { day: "2026-09-23", count: 0 },
      { day: "2026-09-24", count: 2 },
      { day: "2026-09-25", count: 0 },
    ]);
  });

  it("computes rates and changes", () => {
    expect(rate(50, 200)).toBe(25);
    expect(rate(3, 0)).toBeNull();
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(5, 0)).toBeNull();
  });
});
