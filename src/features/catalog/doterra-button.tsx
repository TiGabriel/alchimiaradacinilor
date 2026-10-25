import { ArrowUpRight, Clock } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { outboundHref, type OutboundSource } from "@/services/affiliate/links";

type DoterraButtonProps = {
  product: { slug: string; hasDoterraLink: boolean };
  /** The page the button is on, counted with the click. */
  source: OutboundSource;
  size?: "sm" | "md" | "lg";
  block?: boolean;
  className?: string;
  /** Short "link de recomandare" note with a link to the explanation. */
  note?: boolean;
};

/**
 * "Cumpără de pe doTERRA ↗": opens the product on doTERRA in a new tab, through our click
 * counter. Without a referral link it shows "Link în curând" instead (no dead button).
 * No hooks: works in server and client components.
 */
export function DoterraButton({
  product,
  source,
  size = "md",
  block,
  className,
  note,
}: DoterraButtonProps) {
  if (!product.hasDoterraLink)
    return (
      <p
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-line-strong px-4 text-sm font-semibold text-ink-muted",
          size === "lg" ? "h-13" : size === "sm" ? "h-9" : "h-11",
          block && "w-full",
          className,
        )}
      >
        <Clock aria-hidden className="size-4" /> Link în curând
      </p>
    );

  return (
    <div className={cn("flex flex-col gap-1.5", block && "w-full", className)}>
      <Button
        asChild
        size={size}
        block={block}
        // Narrow cards (two per row on phones): the small button may wrap onto two lines.
        className={
          size === "sm"
            ? "h-auto min-h-9 py-1.5 text-center leading-tight whitespace-normal"
            : undefined
        }
      >
        <a href={outboundHref(product, source)} target="_blank" rel="sponsored noopener">
          Cumpără de pe doTERRA <ArrowUpRight aria-hidden />
          <span className="sr-only"> (se deschide într-o filă nouă)</span>
        </a>
      </Button>
      {note ? (
        <p className="text-xs text-ink-muted">
          Link de recomandare.{" "}
          <Link href="/cum-cumpar#recomandare" className="underline underline-offset-2">
            Ce înseamnă
          </Link>
        </p>
      ) : null}
    </div>
  );
}
