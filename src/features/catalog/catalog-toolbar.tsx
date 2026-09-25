"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { pluralRo } from "@/lib/plural";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Select } from "@/components/ui/select";
import {
  countActiveFilters,
  SORT_OPTIONS,
  type Facets,
  type SortKey,
} from "@/services/catalog/listing";

import { useCatalogState } from "./catalog-state";
import { FilterPanel } from "./filter-panel";

const productCount = (total: number) => pluralRo(total, "produs", "produse");

type CatalogToolbarProps = { total: number; facets: Facets; showCategory: boolean };

export function CatalogToolbar({ total, facets, showCategory }: CatalogToolbarProps) {
  const { filters, update, pending } = useCatalogState();
  const active = countActiveFilters(filters);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-ink-muted" aria-live="polite">
        {pending ? "Se actualizează…" : productCount(total)}
      </p>
      <div className="flex items-center gap-2">
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal aria-hidden />
              Filtre{active ? ` (${active})` : ""}
            </Button>
          </DrawerTrigger>
          <DrawerContent
            side="bottom"
            title="Filtre"
            footer={
              <DrawerClose asChild>
                <Button block>Vezi {productCount(total)}</Button>
              </DrawerClose>
            }
          >
            <FilterPanel facets={facets} showCategory={showCategory} />
          </DrawerContent>
        </Drawer>
        <Select
          aria-label="Sortează după"
          value={filters.sort}
          onValueChange={(value) => update({ sort: value as SortKey })}
          options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          className="h-9 w-auto min-w-44 text-sm"
        />
      </div>
    </div>
  );
}
