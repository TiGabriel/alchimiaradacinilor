import { describe, expect, it } from "vitest";

import { describeSegment, segmentWhere } from "./segment";

describe("segmentWhere", () => {
  it("always targets active subscribers only", () => {
    expect(segmentWhere({})).toEqual({ AND: [{ status: "ACTIVE" }] });
  });

  it("combines interests, sources, customers and date", () => {
    const where = segmentWhere({
      interests: ["seara"],
      sources: ["homepage"],
      customersOnly: true,
      confirmedSince: "2026-09-01",
    });
    expect(where.AND).toEqual([
      { status: "ACTIVE" },
      { interests: { hasSome: ["seara"] } },
      { source: { in: ["homepage"] } },
      { user: { orders: { some: { status: { notIn: ["CANCELLED", "REFUNDED"] } } } } },
      { confirmedAt: { gte: new Date("2026-09-01T00:00:00Z") } },
    ]);
  });

  it("describes the audience", () => {
    expect(describeSegment({})).toBe("Toți abonații activi");
    expect(describeSegment({ interests: ["seara"], customersOnly: true })).toBe(
      "Abonați activi — interese: seara; doar clienți cu comenzi",
    );
  });
});
