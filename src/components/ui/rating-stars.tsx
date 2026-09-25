import { cn } from "@/lib/utils";

type RatingStarsProps = {
  /** 0–5, fractional values allowed. null = no rating yet. */
  value: number | null;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
};

const sizes = { sm: "size-3.5", md: "size-4", lg: "size-5" } as const;

const STAR_PATH =
  "M12 2.8l2.72 5.52 6.08.88-4.4 4.29 1.04 6.06L12 16.69l-5.44 2.86 1.04-6.06-4.4-4.29 6.08-.88L12 2.8z";

function formatRating(value: number) {
  return value.toLocaleString("ro-RO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function reviewCountLabel(count: number) {
  if (count === 1) return "1 recenzie";
  // Romanian: numbers ≥ 20 (and those ending in 00–19 above 100 excepted) take "de".
  const lastTwo = count % 100;
  const needsDe = count >= 20 && !(lastTwo >= 1 && lastTwo <= 19);
  return `${count}${needsDe ? " de" : ""} recenzii`;
}

/** Read-only star rating with partial stars and an accessible label. */
export function RatingStars({
  value,
  count,
  size = "md",
  showValue = false,
  className,
}: RatingStarsProps) {
  const rating = value == null ? 0 : Math.max(0, Math.min(5, value));
  const label =
    value == null
      ? "Fără evaluări încă"
      : `Evaluare ${formatRating(rating)} din 5${count != null ? `, ${reviewCountLabel(count)}` : ""}`;

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span role="img" aria-label={label} className="inline-flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, rating - i));
          return (
            <span key={i} className={cn("relative inline-block", sizes[size])} aria-hidden>
              <svg viewBox="0 0 24 24" className="absolute inset-0 size-full fill-line-strong">
                <path d={STAR_PATH} />
              </svg>
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <svg viewBox="0 0 24 24" className={cn("fill-ochre", sizes[size])}>
                  <path d={STAR_PATH} />
                </svg>
              </span>
            </span>
          );
        })}
      </span>
      {showValue && value != null ? (
        <span aria-hidden className="text-sm font-semibold text-ink">
          {formatRating(rating)}
        </span>
      ) : null}
      {count != null && value != null ? (
        <span aria-hidden className="text-sm text-ink-muted">
          ({count})
        </span>
      ) : null}
    </span>
  );
}
