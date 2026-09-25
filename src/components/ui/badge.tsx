import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-paper-deep text-ink",
        forest: "bg-forest text-ink-inverse",
        sage: "bg-forest-soft text-forest-deep",
        clay: "bg-clay text-white",
        "clay-soft": "bg-clay-soft text-clay",
        ochre: "bg-ochre-soft text-warning",
        outline: "border border-line-strong text-ink-muted",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
        danger: "bg-danger-soft text-danger",
        demo: "border border-dashed border-line-strong bg-surface/80 text-ink-muted",
      },
      size: {
        sm: "px-2 py-0.5 text-[0.6875rem] tracking-wide",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "md" },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
