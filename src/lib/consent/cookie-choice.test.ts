import { describe, expect, it } from "vitest";

import {
  allows,
  CONSENT_MAX_AGE_DAYS,
  makeChoice,
  needsChoice,
  parseChoice,
  serializeChoice,
} from "./cookie-choice";

const ids = { id: "choice_12345", aid: "analytics_1234" };
const now = Date.UTC(2026, 8, 25);

describe("cookie choice", () => {
  it("round-trips through the cookie value", () => {
    const choice = makeChoice({ analytics: true, marketing: false }, "v1", ids, null, now);
    expect(parseChoice(serializeChoice(choice))).toEqual(choice);
    // As read from document.cookie (URL-encoded by the cookie API).
    expect(parseChoice(encodeURIComponent(serializeChoice(choice)))).toEqual(choice);
  });

  it("rejects tampered or malformed values", () => {
    expect(parseChoice("not-json")).toBeNull();
    expect(
      parseChoice(encodeURIComponent(JSON.stringify({ v: "v1", analytics: "yes" }))),
    ).toBeNull();
    expect(
      parseChoice(
        encodeURIComponent(
          JSON.stringify({ v: "v1", analytics: true, marketing: false, at: 1, id: "<script>" }),
        ),
      ),
    ).toBeNull();
  });

  it("asks again without a choice, after a policy change or after 12 months", () => {
    const choice = makeChoice({ analytics: true, marketing: true }, "v1", ids, null, now);
    expect(needsChoice(null, "v1", now)).toBe(true);
    expect(needsChoice(choice, "v1", now)).toBe(false);
    expect(needsChoice(choice, "v2", now)).toBe(true);
    expect(needsChoice(choice, "v1", now + (CONSENT_MAX_AGE_DAYS + 1) * 86_400_000)).toBe(true);
  });

  it("allows optional categories only when explicitly accepted under the current version", () => {
    const choice = makeChoice({ analytics: true, marketing: false }, "v1", ids, null, now);
    expect(allows(choice, "analytics", "v1", now)).toBe(true);
    expect(allows(choice, "marketing", "v1", now)).toBe(false);
    expect(allows(choice, "analytics", "v2", now)).toBe(false);
    expect(allows(null, "analytics", "v1", now)).toBe(false);
  });

  it("drops the analytics id when analytics is withdrawn and keeps the choice id", () => {
    const first = makeChoice({ analytics: true, marketing: false }, "v1", ids, null, now);
    const withdrawn = makeChoice(
      { analytics: false, marketing: false },
      "v1",
      { id: "other_123456", aid: "other_analytics" },
      first,
      now,
    );
    expect(withdrawn).toMatchObject({ id: ids.id, aid: null, analytics: false });
  });
});
