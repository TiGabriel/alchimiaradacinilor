import { cn } from "@/lib/utils";

/** Shimmering placeholder. Static (no shimmer) with reduced motion. */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--color-paper-deep)_0%,var(--color-surface)_50%,var(--color-paper-deep)_100%)] bg-size-[200%_100%] motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}
