import { describe, expect, it } from "vitest";

import type { CategoryNode } from "@/services/catalog/category-tree";

import { buildPersonalRow, popularCategories, resolveEssentials, reviewerName } from "./select";

const p = (id: string, stock = 5) => ({ id, slug: id, stock });

describe("resolveEssentials", () => {
  it("keeps the configured order and numbers the resolved items", () => {
    const result = resolveEssentials(
      [
        { slug: "lemon", note: "Citrică" },
        { slug: "lavender", note: "Florală" },
      ],
      [p("lavender"), p("lemon")],
    );
    expect(result.map((e) => [e.product.slug, e.note, e.position])).toEqual([
      ["lemon", "Citrică", 1],
      ["lavender", "Florală", 2],
    ]);
  });

  it("drops missing products and duplicates without leaving gaps in the numbering", () => {
    const result = resolveEssentials(
      [
        { slug: "missing", note: "x" },
        { slug: "lemon", note: "a" },
        { slug: "lemon", note: "b" },
        { slug: "mint", note: "c" },
      ],
      [p("lemon"), p("mint", 0)],
    );
    expect(result.map((e) => [e.product.slug, e.position])).toEqual([
      ["lemon", 1],
      ["mint", 2],
    ]);
  });
});

describe("popularCategories", () => {
  const node = (slug: string, productCount: number): CategoryNode => ({
    id: slug,
    slug,
    name: slug,
    description: null,
    productCount,
    children: [],
  });

  it("orders by product count, keeps tree order for ties and hides empty categories", () => {
    const tree = [node("a", 2), node("b", 0), node("c", 5), node("d", 2)];
    expect(popularCategories(tree).map((c) => c.slug)).toEqual(["c", "a", "d"]);
    expect(popularCategories(tree, 1).map((c) => c.slug)).toEqual(["c"]);
  });
});

describe("buildPersonalRow", () => {
  const item = (id: string, stock = 5, reason = `r-${id}`) => ({ product: p(id, stock), reason });

  it("prefers quiz picks and tops up from favourites without duplicates", () => {
    const row = buildPersonalRow([item("a"), item("b")], [item("b"), item("c"), item("d")], 3);
    expect(row?.source).toBe("quiz");
    expect(row?.items.map((i) => i.product.id)).toEqual(["a", "b", "c"]);
  });

  it("skips out-of-stock products", () => {
    const row = buildPersonalRow([item("a", 0)], [item("c")]);
    expect(row).toEqual({ source: "favourites", items: [item("c")] });
  });

  it("returns null when there is nothing personal", () => {
    expect(buildPersonalRow([], [])).toBeNull();
    expect(buildPersonalRow([item("a", 0)], [])).toBeNull();
  });
});

describe("reviewerName", () => {
  it("shows only the first name and last initial", () => {
    expect(reviewerName("Ioana", "Mureșan")).toBe("Ioana M.");
    expect(reviewerName("Ștefan", "țurcanu")).toBe("Ștefan Ț.");
    expect(reviewerName("Ana", null)).toBe("Ana");
    expect(reviewerName(null, "Pop")).toBe("Client verificat");
    expect(reviewerName("  ", "")).toBe("Client verificat");
  });
});
