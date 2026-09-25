"use client";

import { X } from "lucide-react";

import {
  EMPTY_FILTERS,
  MULTI_FACETS,
  countActiveFilters,
  type Facets,
} from "@/services/catalog/listing";

import { useCatalogState } from "./catalog-state";

/** Removable chips for every active filter, plus "clear all". */
export function ActiveFilters({ facets }: { facets: Facets }) {
  const { filters, update } = useCatalogState();
  if (countActiveFilters(filters) === 0) return null;

  const chips: Array<{ key: string; label: string; remove: () => void }> = [];
  for (const facet of MULTI_FACETS) {
    for (const value of filters[facet]) {
      const label = facets[facet].find((o) => o.value === value)?.label ?? value;
      chips.push({
        key: `${facet}-${value}`,
        label,
        remove: () => update({ [facet]: filters[facet].filter((v) => v !== value) }),
      });
    }
  }
  if (filters.pretMin != null || filters.pretMax != null) {
    chips.push({
      key: "pret",
      label: `${filters.pretMin ?? 0} – ${filters.pretMax ?? "∞"} RON`,
      remove: () => update({ pretMin: null, pretMax: null }),
    });
  }
  if (filters.rating != null) {
    chips.push({
      key: "rating",
      label: `${filters.rating}+ stele`,
      remove: () => update({ rating: null }),
    });
  }
  if (filters.inStock)
    chips.push({ key: "stoc", label: "În stoc", remove: () => update({ inStock: false }) });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="sr-only">Filtre active:</span>
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.remove}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-forest-soft pr-2 pl-3 text-sm font-semibold text-forest-deep transition-colors hover:bg-sage-soft"
          aria-label={`Elimină filtrul ${chip.label}`}
        >
          {chip.label}
          <X aria-hidden className="size-3.5" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => update({ ...EMPTY_FILTERS, sort: filters.sort })}
        className="h-8 px-2 text-sm font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline"
      >
        Șterge toate
      </button>
    </div>
  );
}
