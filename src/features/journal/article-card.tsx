import Link from "next/link";

import { ImagePlaceholder } from "@/components/media/image-placeholder";
import { SmartImage } from "@/components/media/smart-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ArticleCardData } from "@/services/journal/journal";

export const articleDate = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function ArticleCard({
  article,
  variant = "default",
  className,
}: {
  article: ArticleCardData;
  variant?: "default" | "feature";
  className?: string;
}) {
  const feature = variant === "feature";
  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4",
        feature && "md:grid md:grid-cols-[1.2fr_1fr] md:items-center md:gap-10",
        className,
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl",
          feature ? "aspect-[4/3]" : "aspect-[16/10]",
        )}
      >
        <div className="size-full transition-transform duration-700 ease-(--ease-botanical) group-hover:scale-[1.03] motion-reduce:transition-none">
          {article.cover ? (
            <SmartImage
              src={article.cover.url}
              alt={article.cover.alt ?? ""}
              aspect="auto"
              wrapperClassName="size-full"
              sizes={feature ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 1024px) 33vw, 100vw"}
            />
          ) : (
            <ImagePlaceholder
              kind="leaf"
              tone={
                article.category?.slug === "uleiuri"
                  ? "#B98BB3"
                  : article.category?.slug === "rutine"
                    ? "#E3B23C"
                    : null
              }
            />
          )}
        </div>
        {article.isDemo ? (
          <Badge variant="demo" size="sm" className="absolute top-3 left-3">
            Demo
          </Badge>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-[0.12em] text-clay uppercase">
          {article.category ? <span>{article.category.name}</span> : null}
          <span aria-hidden className="text-line-strong">
            ·
          </span>
          <span className="font-semibold tracking-normal text-ink-muted normal-case">
            {article.readingMinutes} min de citit
          </span>
        </p>
        <h3 className={feature ? "text-display-md" : "text-xl leading-snug"}>
          <Link
            href={`/jurnal/${article.slug}`}
            className="after:absolute after:inset-0 hover:text-forest"
          >
            {article.title}
          </Link>
        </h3>
        {article.excerpt ? (
          <p className={cn("text-ink-muted", !feature && "line-clamp-2 text-sm")}>
            {article.excerpt}
          </p>
        ) : null}
        {article.publishedAt ? (
          <p className="text-xs text-ink-muted">
            {article.author} ·{" "}
            <time dateTime={article.publishedAt.toISOString()}>
              {articleDate.format(article.publishedAt)}
            </time>
          </p>
        ) : null}
      </div>
    </article>
  );
}
