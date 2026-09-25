import { Search } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function JournalCategoryNav({
  categories,
  active,
}: {
  categories: Array<{ slug: string; name: string; articleCount: number }>;
  active?: string | null;
}) {
  const item = (href: string, label: string, current: boolean, count?: number) => (
    <li key={href}>
      <Link
        href={href}
        aria-current={current ? "page" : undefined}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors",
          current
            ? "border-forest bg-forest text-ink-inverse"
            : "border-line-strong bg-surface hover:border-forest hover:text-forest",
        )}
      >
        {label}
        {count != null ? (
          <span className={cn("text-xs", current ? "text-ink-inverse/75" : "text-ink-muted")}>
            {count}
          </span>
        ) : null}
      </Link>
    </li>
  );
  return (
    <nav
      aria-label="Categorii jurnal"
      className="-mx-(--spacing-gutter) scrollbar-none overflow-x-auto px-(--spacing-gutter)"
    >
      <ul className="flex gap-2 md:flex-wrap">
        {item("/jurnal", "Toate", !active)}
        {categories.map((c) =>
          item(`/jurnal/${c.slug}`, c.name, active === c.slug, c.articleCount),
        )}
      </ul>
    </nav>
  );
}

export function JournalSearch({
  defaultValue,
  action = "/jurnal",
}: {
  defaultValue?: string;
  action?: string;
}) {
  return (
    <form action={action} role="search" className="flex w-full max-w-md items-center gap-2">
      <label htmlFor="jurnal-q" className="sr-only">
        Caută în jurnal
      </label>
      <div className="relative flex-1">
        <Search
          aria-hidden
          className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          id="jurnal-q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Caută în jurnal…"
          className="h-11 w-full rounded-full border border-line-strong bg-surface pr-4 pl-10 text-[0.9375rem] focus-visible:border-forest focus-visible:ring-4 focus-visible:ring-forest/12 focus-visible:outline-none"
        />
      </div>
    </form>
  );
}
