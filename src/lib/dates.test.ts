import { describe, expect, it } from "vitest";

import { bucharestDay, endOfBucharestDay, startOfBucharestDay } from "./dates";

describe("Bucharest days", () => {
  it("handles summer (UTC+3) and winter (UTC+2) time", () => {
    expect(startOfBucharestDay("2026-07-01").toISOString()).toBe("2026-06-30T21:00:00.000Z");
    expect(startOfBucharestDay("2026-12-01").toISOString()).toBe("2026-11-30T22:00:00.000Z");
    expect(endOfBucharestDay("2026-12-01").toISOString()).toBe("2026-12-01T21:59:59.999Z");
  });

  it("round-trips days", () => {
    for (const day of ["2026-03-29", "2026-10-25", "2026-09-25"]) {
      expect(bucharestDay(startOfBucharestDay(day))).toBe(day);
      expect(bucharestDay(endOfBucharestDay(day))).toBe(day);
    }
  });
});
