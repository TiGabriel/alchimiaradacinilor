import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Defaults to a botanical sprig. */
  illustration?: React.ReactNode;
  actions?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
  headingLevel?: "h1" | "h2" | "h3";
};

function DefaultIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden className="size-full">
      <circle cx="60" cy="60" r="56" className="fill-forest-soft" />
      <path d="M60 96V42" className="stroke-forest" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M60 62c-10-2-17-9-19-20 11 1 18 8 19 20Z"
        className="fill-sage/60 stroke-forest"
        strokeWidth="1.5"
      />
      <path
        d="M60 52c9-2 15-9 17-19-10 1-16 8-17 19Z"
        className="fill-sage/40 stroke-forest"
        strokeWidth="1.5"
      />
      <path
        d="M60 78c9-1 16-7 18-16-10 0-17 6-18 16Z"
        className="fill-sage/50 stroke-forest"
        strokeWidth="1.5"
      />
      <path d="M48 96h24" className="stroke-forest/50" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Friendly "nothing here yet" block with an optional call to action. */
export function EmptyState({
  title,
  description,
  illustration,
  actions,
  size = "md",
  className,
  headingLevel: Heading = "h2",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center text-center",
        size === "sm" ? "gap-3 py-8" : size === "md" ? "gap-4 py-12" : "gap-5 py-20",
        className,
      )}
    >
      <div className={cn(size === "sm" ? "size-16" : size === "md" ? "size-24" : "size-32")}>
        {illustration ?? <DefaultIllustration />}
      </div>
      <Heading className={cn(size === "lg" ? "text-display-md" : "text-2xl")}>{title}</Heading>
      {description ? <p className="text-ink-muted">{description}</p> : null}
      {actions ? <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div> : null}
    </div>
  );
}
