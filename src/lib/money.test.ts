import { describe, expect, it } from "vitest";

import { discountPercent, formatMoney, percentOf, toMinor } from "./money";

const nbsp = (s: string) => s.replace(/\s/g, " ");

describe("formatMoney", () => {
  it("formats bani as RON with Romanian separators", () => {
    expect(nbsp(formatMoney(4999))).toBe("49,99 RON");
    expect(nbsp(formatMoney(123456))).toBe("1.234,56 RON");
    expect(nbsp(formatMoney(0))).toBe("0,00 RON");
  });

  it("rejects non-integer amounts", () => {
    expect(() => formatMoney(49.99)).toThrow(TypeError);
  });
});

describe("toMinor", () => {
  it("converts decimal amounts, including comma decimals", () => {
    expect(toMinor(49.99)).toBe(4999);
    expect(toMinor("49,99")).toBe(4999);
    expect(toMinor("0.1")).toBe(10);
  });

  it("rounds half away from zero and avoids float drift", () => {
    expect(toMinor(1.005)).toBe(101);
    expect(toMinor(-1.005)).toBe(-101);
  });

  it("rejects invalid input", () => {
    expect(() => toMinor("abc")).toThrow(TypeError);
  });
});

describe("percentOf", () => {
  it("rounds to the nearest ban", () => {
    expect(percentOf(4999, 10)).toBe(500);
    expect(percentOf(1999, 15)).toBe(300);
    expect(percentOf(0, 50)).toBe(0);
  });
});

describe("discountPercent", () => {
  it("returns the whole-percent saving, rounded down", () => {
    expect(discountPercent(5400, 5900)).toBe(8);
    expect(discountPercent(21900, 25500)).toBe(14);
    expect(discountPercent(5000, 10000)).toBe(50);
  });

  it("returns null when there is no real discount", () => {
    expect(discountPercent(4900, null)).toBeNull();
    expect(discountPercent(4900, undefined)).toBeNull();
    expect(discountPercent(4900, 4900)).toBeNull();
    expect(discountPercent(4900, 4000)).toBeNull();
    expect(discountPercent(9999, 10000)).toBeNull();
  });
});
