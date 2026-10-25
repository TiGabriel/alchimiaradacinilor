"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/media/product-image";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { RatingStars } from "@/components/ui/rating-stars";
import { DoterraButton } from "@/features/catalog/doterra-button";
import { WishlistButton } from "@/features/wishlist/wishlist-button";
import { productHref, type ProductCardData } from "@/services/catalog/product-types";

export function PrimaryRecommendation({
  product,
  reason,
}: {
  product: ProductCardData;
  reason: string | null;
}) {
  return (
    <article className="grid overflow-hidden rounded-2xl border border-line bg-surface shadow-soft md:grid-cols-[1fr_1.2fr]">
      <Link href={productHref(product)} className="block" tabIndex={-1} aria-hidden>
        <ProductImage
          name={product.name}
          productType={product.productType}
          image={product.images[0]}
          tone={product.tone}
          priority
          sizes="(min-width: 768px) 40vw, 100vw"
          className="h-full"
        />
      </Link>
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <p className="inline-flex w-fit items-center gap-1.5 rounded-full bg-forest px-3 py-1 text-xs font-bold tracking-wide text-ink-inverse uppercase">
          <Sparkles aria-hidden className="size-3.5" /> Recomandarea principală
        </p>
        {product.brandName ? (
          <p className="text-eyebrow text-ink-muted">{product.brandName}</p>
        ) : null}
        <h2 className="text-display-md">
          <Link href={productHref(product)} className="hover:text-forest">
            {product.name}
          </Link>
        </h2>
        {product.rating != null ? (
          <RatingStars value={product.rating} count={product.reviewCount} />
        ) : null}
        <p className="text-ink-muted">{product.shortDescription}</p>
        {reason ? (
          <div className="flex flex-col gap-1 rounded-lg bg-forest-soft/70 p-4">
            <span className="text-xs font-bold tracking-wide text-forest-deep uppercase">
              De ce
            </span>
            <p className="text-forest-deep">{reason}</p>
          </div>
        ) : null}
        <div className="flex flex-col gap-0.5">
          <Price price={product.price} size="lg" />
          <span className="text-xs text-ink-muted">Preț pe site-ul doTERRA</span>
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <DoterraButton product={product} source="quiz" size="lg" block note />
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="flex-1">
              <Link href={productHref(product)}>
                Vezi detalii <ArrowRight aria-hidden />
              </Link>
            </Button>
            <WishlistButton product={product} variant="inline" className="flex-1" />
          </div>
        </div>
      </div>
    </article>
  );
}
