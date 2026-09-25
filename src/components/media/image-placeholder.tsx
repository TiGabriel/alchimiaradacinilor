import { cn } from "@/lib/utils";

export type PlaceholderKind = "bottle" | "kit" | "diffuser" | "accessory" | "leaf";

type ImagePlaceholderProps = {
  kind?: PlaceholderKind;
  /** Accent colour (e.g. the product's main aroma colour). */
  tone?: string | null;
  label?: string;
  className?: string;
};

const silhouettes: Record<PlaceholderKind, React.ReactNode> = {
  bottle: (
    <g>
      <rect x="86" y="44" width="28" height="18" rx="3" />
      <rect x="92" y="34" width="16" height="12" rx="2" />
      <path d="M78 70c0-5 4-8 8-8h28c4 0 8 3 8 8v84c0 6-4 10-10 10H88c-6 0-10-4-10-10V70Z" />
      <rect x="84" y="96" width="32" height="36" rx="2" className="opacity-40" />
    </g>
  ),
  kit: (
    <g>
      {[52, 88, 124].map((x, i) => (
        <g key={x} transform={`translate(${x} ${i === 1 ? 0 : 12})`}>
          <rect x="6" y="46" width="16" height="10" rx="2" />
          <path d="M0 62c0-4 3-6 6-6h16c3 0 6 2 6 6v76c0 4-3 7-7 7H7c-4 0-7-3-7-7V62Z" />
        </g>
      ))}
      <rect x="40" y="148" width="120" height="16" rx="4" className="opacity-40" />
    </g>
  ),
  diffuser: (
    <g>
      <path d="M62 150c0-40 18-64 38-64s38 24 38 64c0 8-6 14-14 14H76c-8 0-14-6-14-14Z" />
      <circle cx="100" cy="86" r="6" />
      <path
        d="M100 76c-8-8-8-16 0-24s8-16 0-24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-50"
      />
    </g>
  ),
  accessory: (
    <g>
      <rect x="84" y="40" width="32" height="16" rx="8" />
      <path d="M80 62c0-4 3-6 6-6h28c3 0 6 2 6 6v92c0 6-4 10-10 10H90c-6 0-10-4-10-10V62Z" />
      <circle cx="100" cy="48" r="5" className="opacity-40" />
    </g>
  ),
  leaf: (
    <g>
      <path d="M58 150C54 96 82 52 146 46c2 64-32 102-88 104Z" />
      <path
        d="M60 148c30-28 52-54 78-90"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-40"
      />
    </g>
  ),
};

/**
 * Branded stand-in for missing images: warm paper gradient, a tinted silhouette
 * of the product type and a quiet sprig. Decorative; the parent supplies text.
 */
export function ImagePlaceholder({ kind = "leaf", tone, label, className }: ImagePlaceholderProps) {
  const color = tone ?? "var(--color-sage)";
  return (
    <div
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("relative size-full overflow-hidden bg-paper-deep", className)}
      style={{
        backgroundImage: `radial-gradient(120% 90% at 30% 20%, color-mix(in oklab, ${color} 16%, var(--color-surface)) 0%, var(--color-paper-deep) 70%)`,
      }}
    >
      <svg viewBox="0 0 200 200" className="absolute inset-0 m-auto size-[62%]" aria-hidden>
        <g
          style={{ color: `color-mix(in oklab, ${color} 55%, var(--color-forest))` }}
          fill="currentColor"
          className="opacity-[0.22]"
        >
          {silhouettes[kind]}
        </g>
      </svg>
      <svg
        viewBox="0 0 120 160"
        aria-hidden
        className="absolute -right-[6%] -bottom-[8%] w-[38%] text-forest/15"
        fill="none"
      >
        <path d="M60 150C60 110 58 70 62 20" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M61 118C48 114 38 104 34 90C47 92 57 102 61 118Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M61 96C74 92 83 82 86 68C73 71 64 81 61 96Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M61 74C50 70 42 61 40 49C51 52 59 61 61 74Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}
