import { BookOpen, FolderTree, Moon, Search, Tag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductCard } from "@/features/catalog/product-card";
import { pluralRo } from "@/lib/plural";
import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref } from "@/services/catalog/category-tree";
import { getProductCards } from "@/services/catalog/products";
import { searchSite } from "@/services/search";
import { searchQuerySchema } from "@/validation/search";

type Props = PageProps<"/cautare">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { q } = searchQuerySchema.parse(await props.searchParams);
  return {
    title: q ? `Rezultate pentru „${q}”` : "Căutare",
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage(props: Props) {
  const { q } = searchQuerySchema.parse(await props.searchParams);
  const groups = q ? await searchSite(q, 48) : [];
  const productGroup = groups.find((g) => g.type === "product");
  const otherGroups = groups.filter((g) => g.type !== "product");
  const products = await getProductCards(productGroup?.hits.map((h) => h.doc.id) ?? []);
  const total = groups.reduce((n, g) => n + g.total, 0);
  const categories = q && total === 0 ? await getCategoryTree() : [];

  return (
    <div className="container-page pb-(--spacing-section)">
      <header className="flex flex-col gap-5 py-10 md:py-14">
        <p className="text-eyebrow text-clay">Căutare</p>
        <h1 className="text-display-lg">{q ? <>Rezultate pentru „{q}”</> : "Ce cauți astăzi?"}</h1>
        <form action="/cautare" role="search" className="flex max-w-xl items-center gap-2">
          <label htmlFor="cautare-q" className="sr-only">
            Caută în magazin
          </label>
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-muted"
            />
            <input
              id="cautare-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Caută: lavandă, citrice, difuzor…"
              className="h-12 w-full rounded-full border border-line-strong bg-surface pr-4 pl-12 text-ink shadow-xs focus-visible:border-forest focus-visible:ring-4 focus-visible:ring-forest/12 focus-visible:outline-none"
            />
          </div>
          <Button type="submit" size="lg">
            Caută
          </Button>
        </form>
        {q ? <p className="text-ink-muted">{pluralRo(total, "rezultat", "rezultate")}</p> : null}
      </header>

      {q && total === 0 ? (
        <EmptyState
          title="Nu am găsit nimic"
          description="Verifică scrierea sau încearcă un cuvânt mai general — o aromă (citric, floral), o plantă sau un moment al zilei."
          actions={categories.map((c) => (
            <Button key={c.id} asChild variant="outline" size="sm">
              <Link href={categoryHref(c)}>{c.name}</Link>
            </Button>
          ))}
        />
      ) : null}

      {otherGroups.length > 0 ? (
        <div className="mb-12 flex flex-col gap-6">
          {otherGroups.map((group) => (
            <section key={group.type} aria-labelledby={`g-${group.type}`}>
              <h2
                id={`g-${group.type}`}
                className="mb-3 font-sans text-sm font-bold tracking-[0.14em] text-ink-muted uppercase"
              >
                {group.label}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {group.hits.map(({ doc }) => {
                  const Icon =
                    doc.type === "category"
                      ? FolderTree
                      : doc.type === "routine"
                        ? Moon
                        : doc.type === "article"
                          ? BookOpen
                          : Tag;
                  return (
                    <li key={doc.id}>
                      <Link
                        href={doc.href}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-surface px-4 text-sm font-semibold hover:border-forest hover:text-forest"
                      >
                        <Icon aria-hidden className="size-4 text-sage" />
                        {doc.title}
                        {doc.subtitle && doc.type === "category" ? (
                          <span className="font-normal text-ink-muted">· {doc.subtitle}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : null}

      {products.length > 0 ? (
        <section aria-labelledby="g-product">
          <h2
            id="g-product"
            className="mb-6 font-sans text-sm font-bold tracking-[0.14em] text-ink-muted uppercase"
          >
            Produse
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {products.map((product, i) => (
              <li key={product.id}>
                <ProductCard product={product} priority={i < 4} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
