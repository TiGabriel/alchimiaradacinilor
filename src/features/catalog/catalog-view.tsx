import Link from "next/link";

import { Breadcrumbs, type Crumb } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import {
  countActiveFilters,
  serializeCatalogParams,
  type CatalogFilters,
} from "@/services/catalog/listing";
import type { CatalogPageData } from "@/services/catalog/products";

import { ActiveFilters } from "./active-filters";
import { CatalogResults, CatalogStateProvider } from "./catalog-state";
import { CatalogToolbar } from "./catalog-toolbar";
import { FilterPanel } from "./filter-panel";
import { Pagination } from "./pagination";
import { ProductCard } from "./product-card";

type CatalogViewProps = {
  eyebrow: string;
  title: string;
  description?: string | null;
  breadcrumbs: Crumb[];
  basePath: string;
  data: CatalogPageData;
  filters: CatalogFilters;
  /** Sub-navigation chips (e.g. subcategories). */
  links?: Array<{ label: string; href: string; active?: boolean; count?: number }>;
  showCategoryFacet?: boolean;
};

export function CatalogView({
  eyebrow,
  title,
  description,
  breadcrumbs,
  basePath,
  data,
  filters,
  links,
  showCategoryFacet = false,
}: CatalogViewProps) {
  const pageHref = (page: number) => {
    const qs = serializeCatalogParams({ ...filters, page });
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const hasFilters = countActiveFilters(filters) > 0;

  return (
    <CatalogStateProvider filters={filters}>
      <div className="container-page pb-(--spacing-section)">
        <header className="flex flex-col gap-4 pt-6 pb-8 md:pt-8 md:pb-10">
          <Breadcrumbs items={breadcrumbs} />
          <div className="flex max-w-3xl flex-col gap-3 pt-4">
            <p className="text-eyebrow text-clay">{eyebrow}</p>
            <h1 className="text-display-lg">{title}</h1>
            {description ? <p className="text-lg text-ink-muted">{description}</p> : null}
          </div>
          {links && links.length > 0 ? (
            <nav
              aria-label="Subcategorii"
              className="-mx-(--spacing-gutter) scrollbar-none overflow-x-auto px-(--spacing-gutter) pt-2"
            >
              <ul className="flex gap-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={link.active ? "page" : undefined}
                      className={cn(
                        "inline-flex h-9 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
                        link.active
                          ? "border-forest bg-forest text-ink-inverse"
                          : "border-line-strong bg-surface text-ink hover:border-forest hover:text-forest",
                      )}
                    >
                      {link.label}
                      {link.count != null ? (
                        <span
                          className={cn(
                            "text-xs",
                            link.active ? "text-ink-inverse/75" : "text-ink-muted",
                          )}
                        >
                          {link.count}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </header>

        <div className="grid gap-8 lg:grid-cols-[16.5rem_1fr] lg:gap-12">
          <aside aria-label="Filtre" className="hidden lg:block">
            <div className="sticky top-28">
              <h2 className="pb-3 font-sans text-sm font-bold tracking-[0.14em] text-ink-muted uppercase">
                Filtrează
              </h2>
              <FilterPanel facets={data.facets} showCategory={showCategoryFacet} />
            </div>
          </aside>

          <div className="flex min-w-0 flex-col gap-5">
            <CatalogToolbar
              total={data.total}
              facets={data.facets}
              showCategory={showCategoryFacet}
            />
            <ActiveFilters facets={data.facets} />
            <CatalogResults>
              {data.products.length > 0 ? (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
                  {data.products.map((product, i) => (
                    <li key={product.id}>
                      <ProductCard product={product} priority={i < 3} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title={
                    hasFilters
                      ? "Niciun produs nu se potrivește filtrelor"
                      : "Încă nu avem produse aici"
                  }
                  description={
                    hasFilters
                      ? "Încearcă să elimini câteva filtre sau să explorezi alte categorii."
                      : "Revino curând — pregătim produse noi pentru această categorie."
                  }
                  actions={
                    <Button asChild variant={hasFilters ? "primary" : "outline"}>
                      <Link href={hasFilters ? basePath : "/produse"}>
                        {hasFilters ? "Șterge filtrele" : "Vezi toate produsele"}
                      </Link>
                    </Button>
                  }
                />
              )}
            </CatalogResults>
            <div className="pt-6">
              <Pagination page={data.page} pageCount={data.pageCount} hrefFor={pageHref} />
            </div>
          </div>
        </div>
      </div>
    </CatalogStateProvider>
  );
}
