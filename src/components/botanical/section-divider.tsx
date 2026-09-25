import { cn } from "@/lib/utils";

import { Leaf } from "./motifs";

type SectionDividerProps = {
  variant?: "sprig" | "line" | "wave";
  className?: string;
};

/** Quiet separator between sections. */
export function SectionDivider({ variant = "sprig", className }: SectionDividerProps) {
  if (variant === "wave") {
    return (
      <div aria-hidden className={cn("text-line-strong", className)}>
        <svg viewBox="0 0 1200 24" preserveAspectRatio="none" className="h-4 w-full" fill="none">
          <path
            d="M0 12C100 2 200 22 300 12S500 2 600 12 800 22 900 12 1100 2 1200 12"
            stroke="currentColor"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    );
  }

  if (variant === "line") {
    return <hr aria-hidden className={cn("border-0 border-t border-line", className)} />;
  }

  return (
    <div aria-hidden className={cn("flex items-center gap-4 text-line-strong", className)}>
      <span className="h-px flex-1 bg-current" />
      <Leaf className="size-5 -rotate-12 text-sage" />
      <span className="h-px flex-1 bg-current" />
    </div>
  );
}
