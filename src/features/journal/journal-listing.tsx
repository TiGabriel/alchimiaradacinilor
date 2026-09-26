import { Leaf } from "@/components/botanical";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { EmptyState } from "@/components/ui/empty-state";
import type { ArticleCardData } from "@/services/journal/journal";

import { ArticleCard } from "./article-card";
import { JournalCategoryNav, JournalSearch } from "./journal-nav";

type Props = {
  eyebrow: string;
  title: string;
  description?: string | null;
  articles: ArticleCardData[];
  categories: Array<{ slug: string; name: string; articleCount: number }>;
  activeCategory?: string | null;
  query?: string;
  searchAction: string;
};

/** Editorial layout: featured article, category filter, search and the latest articles. */
export function JournalListing({
  eyebrow,
  title,
  description,
  articles,
  categories,
  activeCategory,
  query,
  searchAction,
}: Props) {
  const featured = !query ? (articles.find((a) => a.featured) ?? articles[0]) : undefined;
  const rest = articles.filter((a) => a.id !== featured?.id);

  return (
    <div className="container-page flex flex-col gap-12 pb-(--spacing-section)">
      <Reveal className="flex flex-col gap-4 pt-12 md:pt-16">
        <p className="inline-flex items-center gap-2 text-eyebrow text-clay">
          <Leaf className="size-4 text-clay" /> {eyebrow}
        </p>
        <h1 className="text-display-xl">{title}</h1>
        {description ? <p className="max-w-2xl text-lg text-ink-muted">{description}</p> : null}
      </Reveal>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <JournalCategoryNav categories={categories} active={activeCategory} />
        <JournalSearch defaultValue={query} action={searchAction} />
      </div>

      {query ? (
        <p className="text-ink-muted" aria-live="polite">
          {articles.length
            ? `${articles.length} ${articles.length === 1 ? "articol" : "articole"} pentru „${query}”`
            : null}
        </p>
      ) : null}

      {featured ? (
        <section aria-labelledby="recomandat">
          <h2 id="recomandat" className="sr-only">
            Articol recomandat
          </h2>
          <ArticleCard article={featured} variant="feature" />
        </section>
      ) : null}

      {rest.length ? (
        <section aria-labelledby="cele-mai-noi" className="flex flex-col gap-8">
          <h2 id="cele-mai-noi" className="text-display-md">
            {query ? "Rezultate" : "Cele mai noi"}
          </h2>
          <Stagger className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <StaggerItem key={a.id}>
                <ArticleCard article={a} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      ) : null}

      {articles.length === 0 ? (
        <EmptyState
          title={query ? `Nu am găsit articole pentru „${query}”` : "Încă nu avem articole aici"}
          description={
            query
              ? "Încearcă un alt cuvânt — o aromă, o plantă sau un moment al zilei."
              : "Primele articole din această categorie sunt în lucru."
          }
        />
      ) : null}
    </div>
  );
}
