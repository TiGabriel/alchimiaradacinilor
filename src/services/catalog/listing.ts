/**
 * Catalogue listing logic — pure (no I/O), fully unit-tested.
 *
 * The data layer loads light "listing rows" for a scope (all products or a
 * category subtree); this module parses URL filters, filters, sorts, paginates
 * and computes disjunctive facet counts (each facet's counts respect every
 * *other* active filter). Suitable for catalogues up to a few thousand
 * products — see DECISIONS D-021 for the scaling path.
 */
import { z } from "zod";

export type ListingRow = {
  id: string;
  price: number;
  rating: number | null;
  reviewCount: number;
  stock: number;
  featured: boolean;
  createdAt: Date;
  brand: string | null;
  /** Slug of the product's own category and (if any) its parent. */
  categories: string[];
  tags: string[];
  needs: string[];
  aromas: string[];
};

export const SORT_OPTIONS = [
  { value: "recomandate", label: "Recomandate" },
  { value: "noi", label: "Cele mai noi" },
  { value: "pret-crescator", label: "Preț crescător" },
  { value: "pret-descrescator", label: "Preț descrescător" },
  { value: "rating", label: "Rating" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];
export const DEFAULT_SORT: SortKey = "recomandate";

export const MULTI_FACETS = ["categorie", "brand", "eticheta", "nevoie", "aroma"] as const;
export type MultiFacet = (typeof MULTI_FACETS)[number];

export type CatalogFilters = {
  categorie: string[];
  brand: string[];
  eticheta: string[];
  nevoie: string[];
  aroma: string[];
  /** Whole RON, inclusive. */
  pretMin: number | null;
  pretMax: number | null;
  /** Minimum average rating (1–5). */
  rating: number | null;
  inStock: boolean;
  sort: SortKey;
  page: number;
};

export const EMPTY_FILTERS: CatalogFilters = {
  categorie: [],
  brand: [],
  eticheta: [],
  nevoie: [],
  aroma: [],
  pretMin: null,
  pretMax: null,
  rating: null,
  inStock: false,
  sort: DEFAULT_SORT,
  page: 1,
};

const rowField: Record<MultiFacet, (row: ListingRow) => string[]> = {
  categorie: (r) => r.categories,
  brand: (r) => (r.brand ? [r.brand] : []),
  eticheta: (r) => r.tags,
  nevoie: (r) => r.needs,
  aroma: (r) => r.aromas,
};

// ── URL parsing / serialising ────────────────────────────────────────────────

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function readParam(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

const slugList = z
  .string()
  .transform((s) =>
    [...new Set(s.split(",").map((v) => v.trim().toLowerCase()))].filter((v) =>
      /^[a-z0-9-]{1,80}$/.test(v),
    ),
  );
const wholeNumber = z.coerce.number().int().nonnegative().max(1_000_000);

/** Lenient: invalid values are dropped rather than failing the page. */
export function parseCatalogParams(params: RawParams): CatalogFilters {
  const filters: CatalogFilters = { ...EMPTY_FILTERS };
  for (const facet of MULTI_FACETS) {
    const raw = readParam(params, facet);
    if (raw) filters[facet] = slugList.parse(raw);
  }
  const min = wholeNumber.safeParse(readParam(params, "pret_min"));
  const max = wholeNumber.safeParse(readParam(params, "pret_max"));
  if (readParam(params, "pret_min") && min.success) filters.pretMin = min.data;
  if (readParam(params, "pret_max") && max.success) filters.pretMax = max.data;
  if (filters.pretMin != null && filters.pretMax != null && filters.pretMin > filters.pretMax) {
    [filters.pretMin, filters.pretMax] = [filters.pretMax, filters.pretMin];
  }
  const rating = z.coerce.number().int().min(1).max(5).safeParse(readParam(params, "rating"));
  if (readParam(params, "rating") && rating.success) filters.rating = rating.data;
  filters.inStock = readParam(params, "stoc") === "1";
  const sort = readParam(params, "sortare");
  if (SORT_OPTIONS.some((o) => o.value === sort)) filters.sort = sort as SortKey;
  const page = z.coerce.number().int().min(1).max(10_000).safeParse(readParam(params, "pagina"));
  if (readParam(params, "pagina") && page.success) filters.page = page.data;
  return filters;
}

/** Stable, minimal query string (defaults omitted). Page is reset unless kept explicitly. */
export function serializeCatalogParams(filters: CatalogFilters): string {
  const params = new URLSearchParams();
  for (const facet of MULTI_FACETS) {
    if (filters[facet].length) params.set(facet, [...filters[facet]].sort().join(","));
  }
  if (filters.pretMin != null) params.set("pret_min", String(filters.pretMin));
  if (filters.pretMax != null) params.set("pret_max", String(filters.pretMax));
  if (filters.rating != null) params.set("rating", String(filters.rating));
  if (filters.inStock) params.set("stoc", "1");
  if (filters.sort !== DEFAULT_SORT) params.set("sortare", filters.sort);
  if (filters.page > 1) params.set("pagina", String(filters.page));
  return params.toString();
}

export function countActiveFilters(filters: CatalogFilters): number {
  return (
    MULTI_FACETS.reduce((n, f) => n + filters[f].length, 0) +
    (filters.pretMin != null || filters.pretMax != null ? 1 : 0) +
    (filters.rating != null ? 1 : 0) +
    (filters.inStock ? 1 : 0)
  );
}

// ── Filtering ───────────────────────────────────────────────────────────────

type FacetKey = MultiFacet | "pret" | "rating" | "stoc";

/** OR within a facet, AND across facets. `except` skips one facet (for disjunctive counts). */
export function matchesFilters(
  row: ListingRow,
  filters: CatalogFilters,
  except?: FacetKey,
): boolean {
  for (const facet of MULTI_FACETS) {
    if (facet === except) continue;
    const wanted = filters[facet];
    if (wanted.length && !rowField[facet](row).some((v) => wanted.includes(v))) return false;
  }
  if (except !== "pret") {
    if (filters.pretMin != null && row.price < filters.pretMin * 100) return false;
    if (filters.pretMax != null && row.price > filters.pretMax * 100) return false;
  }
  if (except !== "rating" && filters.rating != null && (row.rating ?? 0) < filters.rating)
    return false;
  if (except !== "stoc" && filters.inStock && row.stock <= 0) return false;
  return true;
}

// ── Sorting ─────────────────────────────────────────────────────────────────

const byNewest = (a: ListingRow, b: ListingRow) => b.createdAt.getTime() - a.createdAt.getTime();
const byRating = (a: ListingRow, b: ListingRow) =>
  (b.rating ?? -1) - (a.rating ?? -1) || b.reviewCount - a.reviewCount;
const inStockFirst = (a: ListingRow, b: ListingRow) => Number(b.stock > 0) - Number(a.stock > 0);

/** Deterministic: ties fall back to newest, then id. Out-of-stock items sink in "recomandate". */
export function sortRows(rows: ListingRow[], sort: SortKey): ListingRow[] {
  const tie = (a: ListingRow, b: ListingRow) => byNewest(a, b) || a.id.localeCompare(b.id);
  const compare: Record<SortKey, (a: ListingRow, b: ListingRow) => number> = {
    recomandate: (a, b) =>
      inStockFirst(a, b) || Number(b.featured) - Number(a.featured) || byRating(a, b) || tie(a, b),
    noi: (a, b) => tie(a, b),
    "pret-crescator": (a, b) => a.price - b.price || tie(a, b),
    "pret-descrescator": (a, b) => b.price - a.price || tie(a, b),
    rating: (a, b) => byRating(a, b) || tie(a, b),
  };
  return [...rows].sort(compare[sort]);
}

// ── Facets ──────────────────────────────────────────────────────────────────

export type FacetOption = { value: string; label: string; count: number; color?: string | null };

export type FacetLabels = Record<
  MultiFacet,
  Map<string, { label: string; color?: string | null; position?: number }>
>;

export type Facets = Record<MultiFacet, FacetOption[]> & {
  price: { min: number; max: number } | null;
  rating: FacetOption[];
  inStockCount: number;
};

/**
 * Options come from the data (never hard-coded). Counts are disjunctive; an
 * option stays visible while selected even if its count drops to 0.
 */
export function computeFacets(
  rows: ListingRow[],
  filters: CatalogFilters,
  labels: FacetLabels,
): Facets {
  const multi = {} as Record<MultiFacet, FacetOption[]>;
  for (const facet of MULTI_FACETS) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      if (!matchesFilters(row, filters, facet)) continue;
      for (const value of new Set(rowField[facet](row)))
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    for (const selected of filters[facet]) if (!counts.has(selected)) counts.set(selected, 0);
    multi[facet] = [...counts.entries()]
      .filter(([value]) => labels[facet].has(value))
      .map(([value, count]) => {
        const meta = labels[facet].get(value)!;
        return {
          value,
          label: meta.label,
          count,
          color: meta.color ?? null,
          position: meta.position ?? 0,
        };
      })
      .sort((a, b) => a.position - b.position || a.label.localeCompare(b.label, "ro"))
      .map(({ position: _position, ...option }) => option);
  }

  // Bounds come from the whole scope so they stay stable while filtering.
  const price = rows.length
    ? {
        min: Math.floor(Math.min(...rows.map((r) => r.price)) / 100),
        max: Math.ceil(Math.max(...rows.map((r) => r.price)) / 100),
      }
    : null;

  const ratingRows = rows.filter((r) => matchesFilters(r, filters, "rating"));
  const rating = [4, 3, 2]
    .map((min) => ({
      value: String(min),
      label: `${min} stele și peste`,
      count: ratingRows.filter((r) => (r.rating ?? 0) >= min).length,
    }))
    .filter((o) => o.count > 0 || String(filters.rating) === o.value);

  const inStockCount = rows.filter((r) => matchesFilters(r, filters, "stoc") && r.stock > 0).length;

  return { ...multi, price, rating, inStockCount };
}

// ── Putting it together ─────────────────────────────────────────────────────

export const PAGE_SIZE = 12;

export type ListingResult = {
  total: number;
  page: number;
  pageCount: number;
  /** Ids of the current page, in display order. */
  ids: string[];
  facets: Facets;
};

export function runListing(
  rows: ListingRow[],
  filters: CatalogFilters,
  labels: FacetLabels,
  pageSize = PAGE_SIZE,
): ListingResult {
  const matching = sortRows(
    rows.filter((r) => matchesFilters(r, filters)),
    filters.sort,
  );
  const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
  const page = Math.min(filters.page, pageCount);
  const ids = matching.slice((page - 1) * pageSize, page * pageSize).map((r) => r.id);
  return {
    total: matching.length,
    page,
    pageCount,
    ids,
    facets: computeFacets(rows, filters, labels),
  };
}
