"use client";

import { cn } from "@/lib/utils";

/** Small counter on header icons; re-keys on change so it pops (CSS, reduced-motion safe). */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      key={count}
      aria-hidden
      className={cn(
        "absolute -top-0.5 -right-0.5 grid h-[1.125rem] min-w-[1.125rem] animate-pop place-items-center rounded-full bg-clay px-1 text-[0.625rem] leading-none font-bold text-white tabular-nums ring-2 ring-paper",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
