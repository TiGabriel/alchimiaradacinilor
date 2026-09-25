import { describe, expect, it } from "vitest";

import {
  oneClickUnsubscribeUrl,
  unsubscribeSignature,
  unsubscribeUrl,
  verifyUnsubscribeSignature,
} from "./tokens";

const secret = "x".repeat(32);

describe("unsubscribe signatures", () => {
  it("verifies its own signature only for the same subscriber and secret", () => {
    const sig = unsubscribeSignature("sub-1", secret);
    expect(verifyUnsubscribeSignature("sub-1", sig, secret)).toBe(true);
    expect(verifyUnsubscribeSignature("sub-2", sig, secret)).toBe(false);
    expect(verifyUnsubscribeSignature("sub-1", sig, "y".repeat(32))).toBe(false);
    expect(verifyUnsubscribeSignature("sub-1", "forged", secret)).toBe(false);
    expect(verifyUnsubscribeSignature("sub-1", "", secret)).toBe(false);
  });

  it("builds links for the page and the one-click endpoint", () => {
    const page = new URL(unsubscribeUrl("https://alchimiaradacinilor.ro", "sub-1", secret));
    expect(page.pathname).toBe("/newsletter/dezabonare");
    expect(page.searchParams.get("s")).toBe("sub-1");
    expect(verifyUnsubscribeSignature("sub-1", page.searchParams.get("t")!, secret)).toBe(true);
    expect(oneClickUnsubscribeUrl("https://alchimiaradacinilor.ro", "sub-1", secret)).toContain(
      "/api/newsletter/dezabonare?s=sub-1&t=",
    );
  });
});
