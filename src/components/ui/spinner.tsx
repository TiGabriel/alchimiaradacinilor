import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Se încarcă",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span role="status" className={cn("inline-block size-[1.1em]", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-full animate-spin motion-reduce:animate-none"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="2.5"
        />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
