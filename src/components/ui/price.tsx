import { discountPercent, formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

import { Badge } from "./badge";

type PriceProps = {
  /** Minor units (bani). */
  price: number;
  /** Minor units (bani). */
  compareAtPrice?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showDiscountBadge?: boolean;
  className?: string;
};

const sizes = {
  sm: { price: "text-[0.9375rem]", old: "text-xs" },
  md: { price: "text-lg", old: "text-sm" },
  lg: { price: "text-2xl", old: "text-base" },
  xl: { price: "text-3xl", old: "text-lg" },
} as const;

/** Current price, struck-through old price and discount badge. */
export function Price({
  price,
  compareAtPrice,
  currency,
  size = "md",
  showDiscountBadge = true,
  className,
}: PriceProps) {
  const discount = discountPercent(price, compareAtPrice);
  const s = sizes[size];

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}>
      <span
        className={cn("font-semibold tabular-nums", discount ? "text-clay" : "text-ink", s.price)}
      >
        {discount ? <span className="sr-only">Preț redus: </span> : null}
        {formatMoney(price, currency)}
      </span>
      {discount && compareAtPrice ? (
        <>
          <s className={cn("text-ink-muted tabular-nums decoration-1", s.old)}>
            <span className="sr-only">Preț vechi: </span>
            {formatMoney(compareAtPrice, currency)}
          </s>
          {showDiscountBadge ? (
            <Badge variant="clay" size="sm" className="self-center">
              −{discount}%
            </Badge>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
