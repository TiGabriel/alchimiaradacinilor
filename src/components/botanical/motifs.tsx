import { cn } from "@/lib/utils";

/**
 * Fine-line botanical motifs. Decorative only (aria-hidden), drawn with
 * currentColor so they inherit a token colour (usually text-sage or text-forest/30).
 * Use sparingly: at most one or two per section.
 */

type MotifProps = { className?: string; strokeWidth?: number };

export const SPRIG_PATHS = [
  "M60 150C60 110 58 70 62 20",
  "M61 118C48 114 38 104 34 90C47 92 57 102 61 118Z",
  "M61 96C74 92 83 82 86 68C73 71 64 81 61 96Z",
  "M61 74C50 70 42 61 40 49C51 52 59 61 61 74Z",
  "M62 52C71 48 77 40 79 30C70 33 64 40 62 52Z",
];

export function Sprig({ className, strokeWidth = 1.25 }: MotifProps) {
  return (
    <svg viewBox="0 0 120 160" fill="none" aria-hidden className={cn("text-sage", className)}>
      {SPRIG_PATHS.map((d) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export function Leaf({ className, strokeWidth = 1.25 }: MotifProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={cn("text-sage", className)}>
      <path
        d="M12 52C10 30 24 12 54 10C54 36 38 52 12 52Z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
      <path
        d="M12 52C24 40 34 30 46 18"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}

export const ROOT_PATHS = [
  "M100 0V46",
  "M100 46C100 70 84 84 62 96C44 106 34 120 30 140",
  "M100 46C100 72 116 86 138 98C156 108 166 122 170 140",
  "M100 60C100 88 96 108 100 140",
  "M76 88C66 92 56 90 46 82",
  "M124 90C134 94 146 92 154 84",
];

/** Branching root lines — the brand's "rădăcini". */
export function Roots({ className, strokeWidth = 1.1 }: MotifProps) {
  return (
    <svg viewBox="0 0 200 140" fill="none" aria-hidden className={cn("text-sage", className)}>
      {ROOT_PATHS.map((d) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
      ))}
    </svg>
  );
}

export function Blossom({ className, strokeWidth = 1.2 }: MotifProps) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden className={cn("text-sage", className)}>
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse
          key={r}
          cx="32"
          cy="18"
          rx="7"
          ry="12"
          transform={`rotate(${r} 32 32)`}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
      ))}
      <circle cx="32" cy="32" r="4" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}
