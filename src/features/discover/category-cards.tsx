import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ImagePlaceholder, type PlaceholderKind } from "@/components/media/image-placeholder";
import { Stagger, StaggerItem } from "@/components/motion";
import { pluralRo } from "@/lib/plural";
import { categoryHref, type CategoryNode } from "@/services/catalog/category-tree";

/** Placeholder art per known top-level category slug (until categories have images). */
const categoryArt: Record<string, PlaceholderKind> = {
  "uleiuri-individuale": "bottle",
  amestecuri: "bottle",
  kituri: "kit",
  difuzoare: "diffuser",
  accesorii: "accessory",
};

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  return (
    <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
      {categories.map((category) => (
        <StaggerItem key={category.id}>
          <Link
            href={categoryHref(category)}
            className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl sm:aspect-[5/4]"
          >
            <div className="absolute inset-0 transition-transform duration-700 ease-(--ease-botanical) group-hover:scale-[1.04] motion-reduce:transition-none">
              <ImagePlaceholder kind={categoryArt[category.slug] ?? "leaf"} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/15 to-transparent" />
            <div className="relative flex items-end justify-between gap-2 p-4 md:p-6">
              <div className="flex flex-col">
                <h3 className="font-display text-xl text-ink-inverse md:text-2xl">
                  {category.name}
                </h3>
                <span className="text-sm text-ink-inverse/85">
                  {pluralRo(category.productCount, "produs", "produse")}
                </span>
              </div>
              <span className="hidden size-10 shrink-0 place-items-center rounded-full bg-paper/90 text-forest transition-transform group-hover:translate-x-0.5 sm:grid">
                <ArrowRight aria-hidden className="size-4" />
              </span>
            </div>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function CategoryDirectory({ categories }: { categories: CategoryNode[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <li
          key={category.id}
          className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6"
        >
          <div className="flex items-start gap-4">
            <div className="size-16 shrink-0 overflow-hidden rounded-lg">
              <ImagePlaceholder kind={categoryArt[category.slug] ?? "leaf"} />
            </div>
            <div className="flex flex-col gap-1">
              <Link
                href={categoryHref(category)}
                className="font-display text-xl hover:text-forest"
              >
                {category.name}
              </Link>
              <span className="text-sm text-ink-muted">
                {pluralRo(category.productCount, "produs", "produse")}
              </span>
            </div>
          </div>
          {category.description ? (
            <p className="text-sm text-ink-muted">{category.description}</p>
          ) : null}
          {category.children.length ? (
            <ul className="flex flex-wrap gap-2">
              {category.children.map((child) => (
                <li key={child.id}>
                  <Link
                    href={categoryHref(child, category)}
                    className="inline-flex h-8 items-center rounded-full bg-paper-deep px-3 text-sm font-semibold hover:bg-forest-soft hover:text-forest-deep"
                  >
                    {child.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
