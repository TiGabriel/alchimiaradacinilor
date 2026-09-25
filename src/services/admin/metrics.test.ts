import { describe, expect, it } from "vitest";

import { fillDays, funnel, percentChange, shopDay } from "./metrics";

describe("dashboard metrics", () => {
  it("uses the shop's time zone for days", () => {
    expect(shopDay(new Date("2026-09-25T22:30:00Z"))).toBe("2026-09-26");
    expect(shopDay(new Date("2026-09-25T20:00:00Z"))).toBe("2026-09-25");
  });

  it("fills missing days with zeros, oldest first", () => {
    const today = new Date("2026-09-25T12:00:00Z");
    const points = fillDays([{ day: "2026-09-24", revenue: 5000, orders: 2 }], 3, today);
    expect(points).toEqual([
      { day: "2026-09-23", revenue: 0, orders: 0 },
      { day: "2026-09-24", revenue: 5000, orders: 2 },
      { day: "2026-09-25", revenue: 0, orders: 0 },
    ]);
  });

  it("computes step conversion", () => {
    expect(
      funnel([
        { name: "a", label: "A", count: 200 },
        { name: "b", label: "B", count: 50 },
        { name: "c", label: "C", count: 0 },
        { name: "d", label: "D", count: 3 },
      ]).map((s) => s.rate),
    ).toEqual([null, 25, 0, null]);
    expect(percentChange(120, 100)).toBe(20);
    expect(percentChange(5, 0)).toBeNull();
  });
});
