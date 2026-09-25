import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { JsonLd } from "@/components/seo/json-ld";
import { siteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/** Breadcrumb trail + BreadcrumbList JSON-LD. The last crumb is the current page. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const all: Crumb[] = [{ label: "Acasă", href: "/" }, ...items];
  return (
    <nav aria-label="Fir de navigare" className={cn("text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-ink-muted">
        {all.map((crumb, i) => {
          const last = i === all.length - 1;
          return (
            <li key={`${crumb.label}-${i}`} className="inline-flex items-center gap-1">
              {crumb.href && !last ? (
                <Link href={crumb.href} className="rounded-xs transition-colors hover:text-forest">
                  {crumb.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(last && "font-semibold text-ink")}
                >
                  {crumb.label}
                </span>
              )}
              {!last ? <ChevronRight aria-hidden className="size-3.5 text-line-strong" /> : null}
            </li>
          );
        })}
      </ol>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((crumb, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: crumb.label,
            ...(crumb.href ? { item: siteUrl(crumb.href) } : {}),
          })),
        }}
      />
    </nav>
  );
}
