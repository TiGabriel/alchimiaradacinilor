import { describe, expect, it } from "vitest";

import { productHref, stockLabel, stockStatus } from "./product-types";

describe("stock status", () => {
  it("classifies stock levels", () => {
    expect(stockStatus(0)).toBe("out-of-stock");
    expect(stockStatus(-1)).toBe("out-of-stock");
    expect(stockStatus(3)).toBe("low-stock");
    expect(stockStatus(4)).toBe("in-stock");
  });

  it("labels stock in Romanian", () => {
    expect(stockLabel(0)).toBe("Stoc epuizat");
    expect(stockLabel(1)).toBe("Ultimul produs în stoc");
    expect(stockLabel(2)).toBe("Doar 2 în stoc");
    expect(stockLabel(20)).toBe("În stoc");
  });

  it("builds product URLs", () => {
    expect(productHref({ slug: "lemon" })).toBe("/produs/lemon");
  });
});
