import { describe, expect, it } from "vitest";

import {
  computeFacets,
  countActiveFilters,
  EMPTY_FILTERS,
  matchesFilters,
  parseCatalogParams,
  runListing,
  serializeCatalogParams,
  sortRows,
  type CatalogFilters,
  type FacetLabels,
  type ListingRow,
} from "./listing";

const day = (n: number) => new Date(Date.UTC(2026, 0, n));

const row = (overrides: Partial<ListingRow> & { id: string }): ListingRow => ({
  price: 5000,
  rating: null,
  reviewCount: 0,
  stock: 10,
  featured: false,
  createdAt: day(1),
  brand: "botanica",
  categories: ["uleiuri"],
  tags: [],
  needs: [],
  aromas: [],
  ...overrides,
});

const rows: ListingRow[] = [
  row({
    id: "lemon",
    price: 4900,
    aromas: ["citric", "proaspat"],
    needs: ["energie"],
    createdAt: day(5),
    featured: true,
  }),
  row({
    id: "lavender",
    price: 5900,
    aromas: ["floral"],
    needs: ["seara", "relaxare"],
    rating: 4.8,
    reviewCount: 12,
    stock: 3,
  }),
  row({
    id: "tea-tree",
    price: 4900,
    aromas: ["proaspat"],
    needs: ["casa"],
    stock: 0,
    createdAt: day(9),
  }),
  row({
    id: "kit",
    price: 21900,
    categories: ["kituri"],
    tags: ["cadou"],
    rating: 4.2,
    reviewCount: 3,
    featured: true,
  }),
  row({
    id: "diffuser",
    price: 18900,
    brand: "atelier",
    categories: ["difuzoare"],
    tags: ["cadou"],
    createdAt: day(20),
  }),
];

const labels: FacetLabels = {
  categorie: new Map([
    ["uleiuri", { label: "Uleiuri", position: 0 }],
    ["kituri", { label: "Kit-uri", position: 1 }],
    ["difuzoare", { label: "Difuzoare", position: 2 }],
  ]),
  brand: new Map([
    ["botanica", { label: "Botanica" }],
    ["atelier", { label: "Atelier" }],
  ]),
  eticheta: new Map([["cadou", { label: "Cadou" }]]),
  nevoie: new Map([
    ["energie", { label: "Energie" }],
    ["seara", { label: "Seară" }],
    ["relaxare", { label: "Relaxare" }],
    ["casa", { label: "Casă" }],
  ]),
  aroma: new Map([
    ["citric", { label: "Citric", color: "#E3B23C", position: 0 }],
    ["floral", { label: "Floral", position: 1 }],
    ["proaspat", { label: "Proaspăt", position: 2 }],
  ]),
};

const f = (overrides: Partial<CatalogFilters>): CatalogFilters => ({
  ...EMPTY_FILTERS,
  ...overrides,
});

describe("parseCatalogParams", () => {
  it("parses multi-value facets, price, rating, stock, sort and page", () => {
    const filters = parseCatalogParams({
      aroma: "citric,floral,citric",
      brand: "botanica",
      pret_min: "40",
      pret_max: "60",
      rating: "4",
      stoc: "1",
      sortare: "pret-crescator",
      pagina: "2",
    });
    expect(filters).toMatchObject({
      aroma: ["citric", "floral"],
      brand: ["botanica"],
      pretMin: 40,
      pretMax: 60,
      rating: 4,
      inStock: true,
      sort: "pret-crescator",
      page: 2,
    });
  });

  it("drops invalid values instead of failing", () => {
    const filters = parseCatalogParams({
      aroma: "citric,<script>,",
      pret_min: "-5",
      rating: "9",
      sortare: "random",
      pagina: "0",
      stoc: "yes",
    });
    expect(filters.aroma).toEqual(["citric"]);
    expect(filters.pretMin).toBeNull();
    expect(filters.rating).toBeNull();
    expect(filters.sort).toBe("recomandate");
    expect(filters.page).toBe(1);
    expect(filters.inStock).toBe(false);
  });

  it("swaps an inverted price range", () => {
    expect(parseCatalogParams({ pret_min: "100", pret_max: "20" })).toMatchObject({
      pretMin: 20,
      pretMax: 100,
    });
  });

  it("accepts URLSearchParams and array values", () => {
    expect(parseCatalogParams(new URLSearchParams("nevoie=seara")).nevoie).toEqual(["seara"]);
    expect(parseCatalogParams({ nevoie: ["casa", "seara"] }).nevoie).toEqual(["casa"]);
  });
});

describe("serializeCatalogParams", () => {
  it("omits defaults and sorts values for stable URLs", () => {
    expect(serializeCatalogParams(EMPTY_FILTERS)).toBe("");
    expect(
      serializeCatalogParams(
        f({ aroma: ["floral", "citric"], inStock: true, sort: "noi", page: 3 }),
      ),
    ).toBe("aroma=citric%2Cfloral&stoc=1&sortare=noi&pagina=3");
  });

  it("round-trips", () => {
    const filters = f({ brand: ["atelier"], pretMin: 10, pretMax: 200, rating: 3, sort: "rating" });
    expect(parseCatalogParams(new URLSearchParams(serializeCatalogParams(filters)))).toEqual(
      filters,
    );
  });
});

describe("matchesFilters", () => {
  it("ORs values within a facet and ANDs across facets", () => {
    const filters = f({ aroma: ["citric", "floral"], nevoie: ["seara"] });
    expect(rows.filter((r) => matchesFilters(r, filters)).map((r) => r.id)).toEqual(["lavender"]);
  });

  it("filters price in whole RON, inclusive", () => {
    const filters = f({ pretMin: 49, pretMax: 59 });
    expect(rows.filter((r) => matchesFilters(r, filters)).map((r) => r.id)).toEqual([
      "lemon",
      "lavender",
      "tea-tree",
    ]);
  });

  it("filters by minimum rating and availability", () => {
    expect(rows.filter((r) => matchesFilters(r, f({ rating: 4 }))).map((r) => r.id)).toEqual([
      "lavender",
      "kit",
    ]);
    expect(
      rows.filter((r) => matchesFilters(r, f({ inStock: true }))).map((r) => r.id),
    ).not.toContain("tea-tree");
  });

  it("can ignore one facet", () => {
    expect(matchesFilters(rows[0]!, f({ aroma: ["floral"] }), "aroma")).toBe(true);
  });
});

describe("sortRows", () => {
  const ids = (sort: Parameters<typeof sortRows>[1]) => sortRows(rows, sort).map((r) => r.id);

  it("sorts by price both ways with deterministic ties (newest first)", () => {
    expect(ids("pret-crescator")).toEqual(["tea-tree", "lemon", "lavender", "diffuser", "kit"]);
    expect(ids("pret-descrescator")).toEqual(["kit", "diffuser", "lavender", "tea-tree", "lemon"]);
  });

  it("sorts by newest", () => {
    expect(ids("noi")).toEqual(["diffuser", "tea-tree", "lemon", "kit", "lavender"]);
  });

  it("sorts by rating, unrated last", () => {
    expect(ids("rating").slice(0, 2)).toEqual(["lavender", "kit"]);
  });

  it("recommended: in stock first, then featured, then rating", () => {
    const order = ids("recomandate");
    expect(order.slice(0, 2)).toEqual(["kit", "lemon"]);
    expect(order.at(-1)).toBe("tea-tree");
  });

  it("does not mutate its input", () => {
    const copy = [...rows];
    sortRows(rows, "pret-crescator");
    expect(rows).toEqual(copy);
  });
});

describe("computeFacets", () => {
  it("builds options from data with counts and labels", () => {
    const facets = computeFacets(rows, EMPTY_FILTERS, labels);
    expect(facets.categorie).toEqual([
      { value: "uleiuri", label: "Uleiuri", count: 3, color: null },
      { value: "kituri", label: "Kit-uri", count: 1, color: null },
      { value: "difuzoare", label: "Difuzoare", count: 1, color: null },
    ]);
    expect(facets.aroma[0]).toEqual({
      value: "citric",
      label: "Citric",
      count: 1,
      color: "#E3B23C",
    });
    expect(facets.price).toEqual({ min: 49, max: 219 });
    expect(facets.inStockCount).toBe(4);
  });

  it("counts disjunctively: a facet ignores its own selection", () => {
    const facets = computeFacets(rows, f({ aroma: ["citric"] }), labels);
    // Other aroma options still show what selecting them would add.
    expect(facets.aroma.find((o) => o.value === "floral")?.count).toBe(1);
    // Other facets are narrowed by the aroma selection.
    expect(facets.nevoie.map((o) => o.value)).toEqual(["energie"]);
  });

  it("keeps a selected option visible with a zero count", () => {
    const facets = computeFacets(rows, f({ categorie: ["kituri"], aroma: ["floral"] }), labels);
    expect(facets.aroma.find((o) => o.value === "floral")).toMatchObject({ count: 0 });
  });

  it("ignores values without labels (inactive taxonomy)", () => {
    const facets = computeFacets([row({ id: "x", tags: ["ascuns"] })], EMPTY_FILTERS, labels);
    expect(facets.eticheta).toEqual([]);
  });

  it("offers rating thresholds that have results", () => {
    expect(computeFacets(rows, EMPTY_FILTERS, labels).rating.map((o) => o.value)).toEqual([
      "4",
      "3",
      "2",
    ]);
    expect(computeFacets([row({ id: "x" })], EMPTY_FILTERS, labels).rating).toEqual([]);
  });
});

describe("runListing", () => {
  it("paginates and clamps the page", () => {
    const result = runListing(rows, f({ sort: "pret-crescator", page: 9 }), labels, 2);
    expect(result).toMatchObject({ total: 5, page: 3, pageCount: 3, ids: ["kit"] });
  });

  it("returns an empty page when nothing matches", () => {
    const result = runListing(rows, f({ aroma: ["floral"], categorie: ["kituri"] }), labels);
    expect(result).toMatchObject({ total: 0, page: 1, pageCount: 1, ids: [] });
  });
});

describe("countActiveFilters", () => {
  it("counts each selected value and each scalar filter once", () => {
    expect(countActiveFilters(EMPTY_FILTERS)).toBe(0);
    expect(
      countActiveFilters(
        f({ aroma: ["a", "b"], pretMin: 1, pretMax: 2, inStock: true, sort: "noi" }),
      ),
    ).toBe(4);
  });
});
