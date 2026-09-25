import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import type { SettingValue } from "@/validation/settings";

type LogoProps = {
  /** The `brand` site setting — swap the logo in SiteSettings, not in code. */
  brand: SettingValue<"brand">;
  href?: string | null;
  size?: "sm" | "md" | "lg";
  tone?: "ink" | "inverse";
  className?: string;
};

function Mark({ className }: { className?: string }) {
  // A seedling above branching roots.
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden className={className}>
      <path d="M20 4v17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M20 12c-5-.5-8.5-4-9-9 5 .5 8.5 4 9 9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M20 16c4.5-.5 7.5-3.5 8-8-4.5.5-7.5 3.5-8 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 21h24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M20 21c0 5-3 8-8 11M20 21c0 5 3 8 8 11M20 21v14"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        className="opacity-70"
      />
    </svg>
  );
}

const sizes = {
  sm: { mark: "size-7", primary: "text-lg", secondary: "text-[0.5625rem]" },
  md: { mark: "size-9", primary: "text-[1.375rem]", secondary: "text-[0.625rem]" },
  lg: { mark: "size-12", primary: "text-3xl", secondary: "text-xs" },
} as const;

/**
 * The site logo. Driven entirely by the `brand` SiteSetting: a temporary text
 * wordmark today, an uploaded image later — no code change needed.
 */
export function Logo({ brand, href = "/", size = "md", tone = "ink", className }: LogoProps) {
  const s = sizes[size];
  const content =
    brand.logo.kind === "image" ? (
      <Image
        src={brand.logo.src}
        alt={brand.logo.alt}
        width={brand.logo.width}
        height={brand.logo.height}
        priority
        className="h-auto max-h-12 w-auto"
      />
    ) : (
      <span
        className={cn(
          "inline-flex items-center gap-2.5",
          tone === "ink" ? "text-forest" : "text-ink-inverse",
        )}
      >
        <span aria-hidden className="contents">
          <Mark className={cn("shrink-0", s.mark)} />
          <span className="flex flex-col leading-none">
            <span
              className={cn(
                "font-display font-medium tracking-tight",
                s.primary,
                tone === "ink" && "text-ink",
              )}
            >
              {brand.logo.primary}
            </span>
            {brand.logo.secondary ? (
              <span
                className={cn("mt-1 font-sans font-bold tracking-[0.32em] uppercase", s.secondary)}
              >
                {brand.logo.secondary}
              </span>
            ) : null}
          </span>
        </span>
        <span className="sr-only">{brand.siteName}</span>
      </span>
    );

  if (!href) return <span className={className}>{content}</span>;

  return (
    <Link
      href={href}
      className={cn("inline-flex rounded-sm focus-visible:outline-offset-4", className)}
      aria-label={`${brand.siteName} — pagina principală`}
    >
      {content}
    </Link>
  );
}
