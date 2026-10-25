import { describe, expect, it } from "vitest";

import { describeSegment, segmentWhere } from "./segment";

describe("segmentWhere", () => {
  it("always targets active subscribers only", () => {
    expect(segmentWhere({})).toEqual({ AND: [{ status: "ACTIVE" }] });
  });

  it("combines interests, sources, members and date", () => {
    const where = segmentWhere({
      interests: ["seara"],
      sources: ["homepage"],
      membersOnly: true,
      confirmedSince: "2026-09-01",
    });
    expect(where.AND).toEqual([
      { status: "ACTIVE" },
      { interests: { hasSome: ["seara"] } },
      { source: { in: ["homepage"] } },
      { userId: { not: null } },
      { confirmedAt: { gte: new Date("2026-09-01T00:00:00Z") } },
    ]);
  });

  it("describes the audience", () => {
    expect(describeSegment({})).toBe("Toți abonații activi");
    expect(describeSegment({ interests: ["seara"], membersOnly: true })).toBe(
      "Abonați activi — interese: seara; doar membri cu cont",
    );
  });
});
