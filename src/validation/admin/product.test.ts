import { describe, expect, it } from "vitest";

import { productFormSchema, type ProductFormInput } from "./product";

const base: ProductFormInput = {
  name: "Lavandă",
  slug: "lavanda",
  sku: "ar-lav-10",
  brandId: "",
  categoryId: "01900000-0000-7000-8000-000000000001",
  productType: "INDIVIDUAL_OIL",
  shortDescription: "Aromă florală, rotundă, pentru serile liniștite.",
  description: "Lavanda are o notă florală moale, ușor dulceagă, potrivită ritualurilor de seară.",
  usageInfo: "",
  safetyInfo: "",
  price: "59,90",
  compareAtPrice: "",
  stock: "12",
  needs: [],
  aromas: [],
  tagIds: [],
  attributes: { volumeMl: "10", tankCapacityMl: "300", botanicalName: "Lavandula angustifolia" },
};

const errors = (input: ProductFormInput) => {
  const r = productFormSchema.safeParse(input);
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("productFormSchema", () => {
  it("normalises money, SKU and type-specific attributes", () => {
    const parsed = productFormSchema.parse(base);
    expect(parsed).toMatchObject({
      price: 5990,
      compareAtPrice: null,
      stock: 12,
      sku: "AR-LAV-10",
      brandId: null,
      usageInfo: null,
      attributes: { volumeMl: 10, botanicalName: "Lavandula angustifolia" },
    });
    // A diffuser field on an oil is dropped.
    expect(parsed.attributes).not.toHaveProperty("tankCapacityMl");
  });

  it("rejects invalid prices, stock and slugs", () => {
    expect(errors({ ...base, price: "0" })).toHaveProperty("price");
    expect(errors({ ...base, price: "abc" })).toHaveProperty("price");
    expect(errors({ ...base, compareAtPrice: "50" })).toHaveProperty("compareAtPrice");
    expect(errors({ ...base, compareAtPrice: "79,90" })).toEqual({});
    expect(errors({ ...base, stock: "-1" })).toHaveProperty("stock");
    expect(errors({ ...base, stock: "2.5" })).toHaveProperty("stock");
    expect(errors({ ...base, slug: "Lavandă Mare" })).toHaveProperty("slug");
    expect(errors({ ...base, categoryId: "" })).toHaveProperty("categoryId");
  });

  it("refuses medical or therapeutic claims in customer-facing copy", () => {
    expect(
      errors({ ...base, shortDescription: "Tratează insomnia și anxietatea." }),
    ).toHaveProperty("shortDescription");
    expect(errors({ ...base, usageInfo: "Previne răcelile." })).toHaveProperty("usageInfo");
  });

  it("validates taxonomy links", () => {
    const id = "01900000-0000-7000-8000-000000000002";
    expect(errors({ ...base, needs: [{ id, relevance: 4 }] })).toHaveProperty("needs.0.relevance");
    expect(
      errors({
        ...base,
        aromas: [
          { id, intensity: 3 },
          { id, intensity: 2 },
        ],
      }),
    ).toHaveProperty("aromas");
  });
});
