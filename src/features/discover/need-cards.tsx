import {
  ArrowRight,
  Brain,
  Droplets,
  HandHeart,
  House,
  Moon,
  Sprout,
  Sun,
  Wind,
} from "lucide-react";
import Link from "next/link";

import { Stagger, StaggerItem } from "@/components/motion";
import { pluralRo } from "@/lib/plural";
import type { TaxonomyEntry } from "@/services/catalog/taxonomy";

/** Decorative icon per known need slug; unknown needs get a sprout. */
const icons: Record<string, typeof Moon> = {
  relaxare: Wind,
  seara: Moon,
  concentrare: Brain,
  energie: Sun,
  casa: House,
  "ingrijire-personala": HandHeart,
  incepator: Sprout,
  prospetime: Droplets,
};

export function NeedCards({ needs }: { needs: TaxonomyEntry[] }) {
  return (
    <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {needs.map((need) => {
        const Icon = icons[need.slug] ?? Sprout;
        return (
          <StaggerItem key={need.slug}>
            <Link
              href={`/produse?nevoie=${need.slug}`}
              className="group flex h-full flex-col gap-3 rounded-xl border border-line bg-surface p-6 shadow-xs transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lifted motion-reduce:hover:translate-y-0"
            >
              <span className="grid size-11 place-items-center rounded-full bg-forest-soft text-forest">
                <Icon aria-hidden className="size-5" />
              </span>
              <h3 className="text-xl">{need.name}</h3>
              {need.description ? (
                <p className="text-sm text-ink-muted">{need.description}</p>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-forest">
                {pluralRo(need.productCount, "produs", "produse")}
                <ArrowRight
                  aria-hidden
                  className="size-4 transition-transform group-hover:translate-x-1"
                />
              </span>
            </Link>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}
