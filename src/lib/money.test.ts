import { describe, expect, it } from "vitest";

import { formatMoney, percentOf, toMinor } from "./money";

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
