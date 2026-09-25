import Link from "next/link";

import { cn } from "@/lib/utils";

/** "Ce cauți?" — pick a need; every option is a link (works without JS, crawlable). */
export function NeedPicker({
  needs,
  active,
  className,
}: {
  needs: Array<{ slug: string; name: string }>;
  active?: string;
  className?: string;
}) {
  return (
    <nav
      aria-label="Alege o nevoie"
      className={cn(
        "-mx-(--spacing-gutter) scrollbar-none overflow-x-auto px-(--spacing-gutter)",
        className,
      )}
    >
      <ul className="flex gap-2 md:flex-wrap">
        {needs.map((need) => {
          const current = need.slug === active;
          return (
            <li key={need.slug}>
              <Link
                href={`/descopera/${need.slug}`}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center rounded-full border px-5 font-semibold whitespace-nowrap transition-colors",
                  current
                    ? "border-forest bg-forest text-ink-inverse"
                    : "border-line-strong bg-surface text-ink hover:border-forest hover:text-forest",
                )}
              >
                {need.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
