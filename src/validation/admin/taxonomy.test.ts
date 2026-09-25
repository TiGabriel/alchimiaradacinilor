import { describe, expect, it } from "vitest";

import { createsCycle, isTaxonomyKind, taxonomySchemas } from "./taxonomy";

describe("taxonomy schemas", () => {
  it("validates per entity", () => {
    expect(
      taxonomySchemas.arome.parse({ name: "Floral", slug: "floral", colorHex: "#c9a0dc" }),
    ).toMatchObject({
      colorHex: "#c9a0dc",
      position: 0,
    });
    expect(
      taxonomySchemas.arome.safeParse({ name: "Floral", slug: "floral", colorHex: "mov" }).success,
    ).toBe(false);
    expect(taxonomySchemas.marci.safeParse({ name: "X", slug: "x" }).success).toBe(false);
    expect(
      taxonomySchemas.marci.parse({ name: "Atelier", slug: "atelier", website: "" }).website,
    ).toBeNull();
    expect(
      taxonomySchemas.nevoi.safeParse({
        name: "Somn",
        slug: "somn",
        description: "Tratează insomnia.",
      }).success,
    ).toBe(false);
    expect(isTaxonomyKind("categorii")).toBe(true);
    expect(isTaxonomyKind("utilizatori")).toBe(false);
  });

  it("detects category cycles", () => {
    const parents = new Map<string, string | null>([
      ["root", null],
      ["child", "root"],
      ["grandchild", "child"],
    ]);
    expect(createsCycle("root", "grandchild", parents)).toBe(true);
    expect(createsCycle("child", "child", parents)).toBe(true);
    expect(createsCycle("grandchild", "root", parents)).toBe(false);
    expect(createsCycle("child", null, parents)).toBe(false);
  });
});
