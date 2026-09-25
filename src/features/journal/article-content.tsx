import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/media/product-image";
import { Markdown } from "@/components/ui/markdown";
import { Price } from "@/components/ui/price";
import { getProductCards } from "@/services/catalog/products";
import { productHref } from "@/services/catalog/product-types";
import { embeddedSlugs, parseArticleContent } from "@/services/journal/content";
import { getRoutineEmbeds } from "@/services/journal/embeds";

/** Renders article Markdown (no raw HTML) with embedded product and routine cards. */
export async function ArticleContent({ content }: { content: string }) {
  const blocks = parseArticleContent(content);
  const slugs = embeddedSlugs(blocks);
  const { productIdsBySlug, routines } = await getRoutineEmbeds(slugs);
  const products = await getProductCards(
    slugs.products.flatMap((s) => productIdsBySlug.get(s) ?? []),
  );
  const productBySlug = new Map(products.map((p) => [p.slug, p]));

  return (
    <div className="flex flex-col gap-6 text-[1.0625rem] leading-relaxed [&_h2]:pt-4 [&_h2]:text-2xl">
      {blocks.map((block, i) => {
        if (block.type === "markdown") return <Markdown key={i}>{block.text}</Markdown>;
        if (block.type === "product") {
          const p = productBySlug.get(block.slug);
          if (!p) return null;
          return (
            <aside
              key={i}
              className="not-prose flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
            >
              <Link
                href={productHref(p)}
                className="w-20 shrink-0 overflow-hidden rounded-md sm:w-24"
                tabIndex={-1}
                aria-hidden
              >
                <ProductImage
                  name={p.name}
                  productType={p.productType}
                  image={p.images[0]}
                  tone={p.tone}
                  aspect="square"
                  sizes="96px"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
                  Produs
                </span>
                <Link
                  href={productHref(p)}
                  className="font-display text-lg leading-snug hover:text-forest"
                >
                  {p.name}
                </Link>
                <span className="line-clamp-1 text-sm text-ink-muted">{p.shortDescription}</span>
                <Price price={p.price} compareAtPrice={p.compareAtPrice} size="sm" />
              </div>
            </aside>
          );
        }
        const r = routines.get(block.slug);
        if (!r) return null;
        return (
          <aside key={i} className="flex flex-col gap-2 rounded-xl bg-forest p-6 text-ink-inverse">
            <span className="text-xs font-bold tracking-[0.12em] text-ink-inverse/70 uppercase">
              Rutină
            </span>
            <Link
              href={`/rutine/${r.slug}`}
              className="font-display text-2xl text-ink-inverse hover:underline"
            >
              {r.title}
            </Link>
            <p className="text-ink-inverse/80">{r.summary}</p>
            <p className="flex items-center gap-4 pt-1 text-sm text-ink-inverse/80">
              {r.durationMinutes ? (
                <span className="inline-flex items-center gap-1">
                  <Clock aria-hidden className="size-4" /> {r.durationMinutes} min
                </span>
              ) : null}
              <Link
                href={`/rutine/${r.slug}`}
                className="inline-flex items-center gap-1 font-semibold text-ink-inverse"
              >
                Vezi rutina <ArrowRight aria-hidden className="size-4" />
              </Link>
            </p>
          </aside>
        );
      })}
    </div>
  );
}
