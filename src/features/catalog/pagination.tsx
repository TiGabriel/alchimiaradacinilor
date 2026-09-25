import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/** Compact page list: 1 … 4 5 6 … 12 */
export function pageWindow(page: number, pageCount: number): Array<number | "gap"> {
  const pages = new Set(
    [1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount),
  );
  const sorted = [...pages].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  for (const [i, p] of sorted.entries()) {
    const prev = sorted[i - 1];
    if (prev != null && p - prev > 1) out.push("gap");
    out.push(p);
  }
  return out;
}

type PaginationProps = { page: number; pageCount: number; hrefFor: (page: number) => string };

/** Crawlable pagination links (SEO-friendly, work without JS). */
export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  if (pageCount <= 1) return null;
  const item =
    "grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-semibold transition-colors";
  return (
    <nav aria-label="Paginare" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link
          href={hrefFor(page - 1)}
          className={cn(item, "hover:bg-paper-deep")}
          aria-label="Pagina anterioară"
        >
          <ChevronLeft aria-hidden className="size-4" />
        </Link>
      ) : null}
      {pageWindow(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} aria-hidden className="px-1 text-ink-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Pagina ${p}`}
            className={cn(item, p === page ? "bg-forest text-ink-inverse" : "hover:bg-paper-deep")}
          >
            {p}
          </Link>
        ),
      )}
      {page < pageCount ? (
        <Link
          href={hrefFor(page + 1)}
          className={cn(item, "hover:bg-paper-deep")}
          aria-label="Pagina următoare"
        >
          <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}
