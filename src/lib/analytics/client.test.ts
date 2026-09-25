// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  registerAnalyticsProvider,
  resetAnalyticsForTests,
  setAnalyticsConsent,
  track,
} from "./client";

function spyProvider() {
  const send = vi.fn();
  registerAnalyticsProvider({ name: "spy", send });
  return send;
}

afterEach(() => resetAnalyticsForTests());

describe("consent-gated analytics", () => {
  it("sends nothing without analytics consent", () => {
    const beacon = vi.fn(() => true);
    Object.assign(navigator, { sendBeacon: beacon });
    const send = spyProvider();
    setAnalyticsConsent(false, null);
    track("product_view", { productId: "p1" });
    expect(send).not.toHaveBeenCalled();
    expect(beacon).not.toHaveBeenCalled();
  });

  it("queues events until consent is known, then sends them", () => {
    const send = spyProvider();
    track("product_view", { productId: "p1" });
    expect(send).not.toHaveBeenCalled();
    setAnalyticsConsent(true, "analytics_1234");
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "product_view",
        anonymousId: "analytics_1234",
        props: { productId: "p1" },
      }),
    );
  });

  it("drops queued events when consent is refused, and stops after withdrawal", () => {
    const send = spyProvider();
    track("search", { q: "lavanda" });
    setAnalyticsConsent(false, null);
    expect(send).not.toHaveBeenCalled();

    setAnalyticsConsent(true, "analytics_1234");
    track("add_to_cart", { productId: "p1", email: "ana@example.ro" });
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]![0].props).toEqual({ productId: "p1" });

    setAnalyticsConsent(false, null);
    track("add_to_cart", { productId: "p2" });
    expect(send).toHaveBeenCalledTimes(1);
  });
});
