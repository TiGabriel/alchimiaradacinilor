import { describe, expect, it } from "vitest";

import { isAllowedReferralUrl, isLikelyBot, outboundHref, parseOutboundSource } from "./links";

const hosts = ["doterra.com", "doterra.me"];

describe("isAllowedReferralUrl", () => {
  it("accepts https links on an allowed domain or its subdomains", () => {
    expect(
      isAllowedReferralUrl("https://www.doterra.com/RO/ro_RO/p/lavender-oil?OwnerID=1", hosts),
    ).toBe(true);
    expect(isAllowedReferralUrl("https://doterra.me/abc123", hosts)).toBe(true);
    expect(isAllowedReferralUrl("https://SHOP.DOTERRA.COM/x", hosts)).toBe(true);
  });

  it("refuses other protocols, look-alike domains, credentials and ports", () => {
    expect(isAllowedReferralUrl("http://www.doterra.com/p", hosts)).toBe(false);
    expect(isAllowedReferralUrl("javascript:alert(1)", hosts)).toBe(false);
    expect(isAllowedReferralUrl("https://doterra.com.evil.ro/p", hosts)).toBe(false);
    expect(isAllowedReferralUrl("https://evildoterra.com/p", hosts)).toBe(false);
    expect(isAllowedReferralUrl("https://user:pass@www.doterra.com/p", hosts)).toBe(false);
    expect(isAllowedReferralUrl("https://www.doterra.com:8443/p", hosts)).toBe(false);
    expect(isAllowedReferralUrl("nu e un link", hosts)).toBe(false);
  });
});

describe("outbound links", () => {
  it("points at the counter route with the page as source", () => {
    expect(outboundHref({ slug: "wild-orange" }, "quiz")).toBe(
      "/spre-doterra/wild-orange?sursa=quiz",
    );
  });

  it("keeps known sources and files the rest under „altul”", () => {
    expect(parseOutboundSource("produs")).toBe("produs");
    expect(parseOutboundSource("<script>")).toBe("altul");
    expect(parseOutboundSource(null)).toBe("altul");
  });

  it("recognises crawlers and link previews", () => {
    expect(isLikelyBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isLikelyBot("facebookexternalhit/1.1")).toBe(true);
    expect(isLikelyBot(null)).toBe(true);
    expect(
      isLikelyBot(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
      ),
    ).toBe(false);
  });
});
