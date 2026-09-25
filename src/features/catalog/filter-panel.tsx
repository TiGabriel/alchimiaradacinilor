"use client";

import { useId, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RatingStars } from "@/components/ui/rating-stars";
import { cn } from "@/lib/utils";
import type { Facets, FacetOption, MultiFacet } from "@/services/catalog/listing";

import { useCatalogState } from "./catalog-state";

const facetTitles: Record<MultiFacet, string> = {
  categorie: "Categorie",
  nevoie: "Nevoie",
  aroma: "Profil aromatic",
  brand: "Brand",
  eticheta: "Etichete",
};

function MultiFacetList({ facet, options }: { facet: MultiFacet; options: FacetOption[] }) {
  const { filters, update } = useCatalogState();
  const idBase = useId();
  const selected = filters[facet];

  return (
    <ul className="flex flex-col gap-3">
      {options.map((option) => {
        const checked = selected.includes(option.value);
        const id = `${idBase}-${option.value}`;
        return (
          <li key={option.value} className="flex items-center justify-between gap-3">
            <Checkbox
              id={id}
              checked={checked}
              disabled={!checked && option.count === 0}
              onCheckedChange={(value) =>
                update({
                  [facet]:
                    value === true
                      ? [...selected, option.value]
                      : selected.filter((v) => v !== option.value),
                })
              }
              label={
                <span className="inline-flex items-center gap-2">
                  {option.color ? (
                    <span
                      aria-hidden
                      className="size-3 rounded-full ring-1 ring-ink/10"
                      style={{ background: option.color }}
                    />
                  ) : null}
                  {option.label}
                </span>
              }
            />
            <span
              className="text-xs text-ink-muted tabular-nums"
              aria-label={`${option.count} produse`}
            >
              {option.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PriceFilter({ bounds }: { bounds: { min: number; max: number } }) {
  const { filters, update } = useCatalogState();
  const id = useId();
  const [min, setMin] = useState(filters.pretMin?.toString() ?? "");
  const [max, setMax] = useState(filters.pretMax?.toString() ?? "");

  const apply = () => {
    const toValue = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.round(Number(v))));
    const pretMin = toValue(min);
    const pretMax = toValue(max);
    if (pretMin === filters.pretMin && pretMax === filters.pretMax) return;
    if ((pretMin != null && Number.isNaN(pretMin)) || (pretMax != null && Number.isNaN(pretMax)))
      return;
    update({ pretMin, pretMax });
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-min`} className="sr-only">
          Preț minim (RON)
        </label>
        <Input
          id={`${id}-min`}
          inputMode="numeric"
          placeholder={`${bounds.min}`}
          value={min}
          onChange={(e) => setMin(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={apply}
          className="h-10 px-3"
        />
        <span aria-hidden className="text-ink-muted">
          –
        </span>
        <label htmlFor={`${id}-max`} className="sr-only">
          Preț maxim (RON)
        </label>
        <Input
          id={`${id}-max`}
          inputMode="numeric"
          placeholder={`${bounds.max}`}
          value={max}
          onChange={(e) => setMax(e.target.value.replace(/[^0-9]/g, ""))}
          onBlur={apply}
          className="h-10 px-3"
        />
        <span className="text-sm text-ink-muted">RON</span>
      </div>
      <Button type="submit" size="sm" variant="outline" className="self-start">
        Aplică
      </Button>
    </form>
  );
}

function RatingFilter({ options }: { options: FacetOption[] }) {
  const { filters, update } = useCatalogState();
  return (
    <ul className="flex flex-col gap-1" role="radiogroup" aria-label="Rating minim">
      {options.map((option) => {
        const value = Number(option.value);
        const active = filters.rating === value;
        return (
          <li key={option.value}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => update({ rating: active ? null : value })}
              className={cn(
                "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-paper-deep",
                active && "bg-forest-soft font-semibold text-forest-deep",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <RatingStars value={value} size="sm" />
                și peste
              </span>
              <span className="text-xs text-ink-muted">{option.count}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type FilterPanelProps = { facets: Facets; showCategory: boolean };

/** All facets, generated from data. Used in the desktop sidebar and the mobile drawer. */
export function FilterPanel({ facets, showCategory }: FilterPanelProps) {
  const { filters, update } = useCatalogState();
  const idBase = useId();
  const order: MultiFacet[] = showCategory
    ? ["categorie", "nevoie", "aroma", "brand", "eticheta"]
    : ["nevoie", "aroma", "brand", "eticheta"];
  const sections = order.filter((facet) => facets[facet].length > 0);
  const defaultOpen = ["disponibilitate", "pret", ...sections.slice(0, 3)];

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="border-t border-line">
      <AccordionItem value="disponibilitate">
        <AccordionTrigger className="py-4 text-base">Disponibilitate</AccordionTrigger>
        <AccordionContent className="pb-5">
          <div className="flex items-center justify-between gap-3">
            <Checkbox
              id={`${idBase}-stoc`}
              checked={filters.inStock}
              onCheckedChange={(value) => update({ inStock: value === true })}
              label="Doar produse în stoc"
            />
            <span className="text-xs text-ink-muted">{facets.inStockCount}</span>
          </div>
        </AccordionContent>
      </AccordionItem>
      {facets.price ? (
        <AccordionItem value="pret">
          <AccordionTrigger className="py-4 text-base">Preț</AccordionTrigger>
          <AccordionContent className="pb-5">
            <PriceFilter key={`${filters.pretMin}-${filters.pretMax}`} bounds={facets.price} />
          </AccordionContent>
        </AccordionItem>
      ) : null}
      {sections.map((facet) => (
        <AccordionItem key={facet} value={facet}>
          <AccordionTrigger className="py-4 text-base">
            {facetTitles[facet]}
            {filters[facet].length ? (
              <span className="mr-2 ml-auto rounded-full bg-forest px-2 text-xs font-bold text-ink-inverse">
                {filters[facet].length}
              </span>
            ) : null}
          </AccordionTrigger>
          <AccordionContent className="pb-5">
            <MultiFacetList facet={facet} options={facets[facet]} />
          </AccordionContent>
        </AccordionItem>
      ))}
      {facets.rating.length ? (
        <AccordionItem value="rating">
          <AccordionTrigger className="py-4 text-base">Rating</AccordionTrigger>
          <AccordionContent className="pb-5">
            <RatingFilter options={facets.rating} />
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  );
}
