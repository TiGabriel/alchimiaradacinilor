import { describe, expect, it } from "vitest";

import { clientIp, isSameOrigin } from "./request";

describe("clientIp", () => {
  it("takes the first forwarded hop, then x-real-ip", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBeNull();
  });
});

describe("isSameOrigin", () => {
  const req = (origin?: string) =>
    new Request("https://alchimiaradacinilor.ro/api/analytics", {
      method: "POST",
      headers: origin ? { origin } : {},
    });

  it("allows same-origin and header-less requests", () => {
    expect(isSameOrigin(req("https://alchimiaradacinilor.ro"))).toBe(true);
    expect(isSameOrigin(req())).toBe(true);
  });

  it("rejects other sites and malformed origins", () => {
    expect(isSameOrigin(req("https://rau.example"))).toBe(false);
    expect(isSameOrigin(req("null"))).toBe(false);
  });
});
