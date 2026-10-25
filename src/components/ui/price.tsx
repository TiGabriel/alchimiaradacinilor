import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

type PriceProps = {
  /** Minor units (bani): the price shown on the doTERRA site. */
  price: number;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** "inverse" for dark sections (forest backgrounds). */
  tone?: "default" | "inverse";
  className?: string;
};

const sizes = {
  sm: "text-[0.9375rem]",
  md: "text-lg",
  lg: "text-2xl",
  xl: "text-3xl",
} as const;

/** A product's price. The site does not sell: this is the price on the doTERRA site. */
export function Price({ price, currency, size = "md", tone = "default", className }: PriceProps) {
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        tone === "inverse" ? "text-ink-inverse" : "text-ink",
        sizes[size],
        className,
      )}
    >
      {formatMoney(price, currency)}
    </span>
  );
}
