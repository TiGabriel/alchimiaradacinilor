"use client";

import { Eye, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProductImage } from "@/components/media/product-image";
import { SmartImage } from "@/components/media/smart-image";
import { Price } from "@/components/ui/price";
import { RatingStars } from "@/components/ui/rating-stars";
import { useCart } from "@/features/cart/cart-context";
import { WishlistButton } from "@/features/wishlist/wishlist-button";
import { cn } from "@/lib/utils";
import { productHref, type ProductCardData } from "@/services/catalog/product-types";

import { ProductBadges } from "./product-badges";
import { QuickView } from "./quick-view";

type ProductCardProps = {
  product: ProductCardData;
  /** Eagerly load the image (first row above the fold). */
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/**
 * Product tile. Desktop: hover reveals the second image and quick actions.
 * Mobile: compact text, an always-visible quick-add button.
 */
export function ProductCard({
  product,
  priority,
  sizes = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw",
  className,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [quickView, setQuickView] = useState(false);
  const [adding, setAdding] = useState(false);
  const href = productHref(product);
  const soldOut = product.stock <= 0;
  const [first, second] = product.images;

  const quickAdd = async () => {
    setAdding(true);
    try {
      await addItem(product, 1);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className={cn("group/card relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-lg bg-paper-deep">
        <div className="block">
          <div className="transition-transform duration-700 ease-(--ease-botanical) group-hover/card:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/card:scale-100">
            <ProductImage
              name={product.name}
              productType={product.productType}
              image={first}
              tone={product.tone}
              sizes={sizes}
              priority={priority}
            />
          </div>
          {second ? (
            <SmartImage
              src={second.url}
              alt=""
              aspect="portrait"
              sizes={sizes}
              wrapperClassName="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
            />
          ) : null}
        </div>

        <ProductBadges product={product} className="absolute top-3 left-3 z-10" />
        <WishlistButton product={product} className="absolute top-2.5 right-2.5 z-10" />

        {/* Desktop quick actions */}
        <div className="absolute inset-x-3 bottom-3 z-10 hidden translate-y-2 gap-2 opacity-0 transition-[opacity,transform] duration-300 ease-(--ease-botanical) group-focus-within/card:translate-y-0 group-focus-within/card:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 md:flex">
          <button
            type="button"
            onClick={quickAdd}
            disabled={soldOut || adding}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-forest px-3 text-sm font-semibold text-ink-inverse shadow-soft transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:bg-ink-muted/60"
          >
            {soldOut ? "Stoc epuizat" : adding ? "Se adaugă…" : "Adaugă rapid"}
          </button>
          <button
            type="button"
            onClick={() => setQuickView(true)}
            className="grid size-10 place-items-center rounded-full bg-surface/95 text-ink shadow-soft transition-colors hover:text-forest"
            aria-label={`Previzualizare rapidă: ${product.name}`}
            title="Previzualizare rapidă"
          >
            <Eye aria-hidden className="size-[1.15rem]" />
          </button>
        </div>

        {/* Mobile quick add */}
        {!soldOut ? (
          <button
            type="button"
            onClick={quickAdd}
            disabled={adding}
            className="absolute right-2.5 bottom-2.5 z-10 grid size-10 place-items-center rounded-full bg-forest text-ink-inverse shadow-soft md:hidden"
            aria-label={`Adaugă ${product.name} în coș`}
          >
            <Plus aria-hidden className="size-5" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3 md:pt-4">
        {product.brandName ? (
          <p className="text-[0.6875rem] font-bold tracking-[0.14em] text-ink-muted uppercase">
            {product.brandName}
          </p>
        ) : null}
        <h3 className="font-display text-[1.0625rem] leading-snug md:text-xl">
          <Link
            href={href}
            className="rounded-xs transition-colors after:absolute after:inset-0 after:z-0 hover:text-forest focus-visible:outline-offset-4"
          >
            {product.name}
          </Link>
        </h3>
        <p className="line-clamp-2 text-sm text-ink-muted max-md:hidden">
          {product.shortDescription}
        </p>
        {product.rating != null ? (
          <RatingStars
            value={product.rating}
            count={product.reviewCount}
            size="sm"
            className="mt-0.5"
          />
        ) : null}
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="sm"
          showDiscountBadge={false}
          className="mt-auto pt-1"
        />
      </div>

      {quickView ? (
        <QuickView product={product} open={quickView} onOpenChange={setQuickView} />
      ) : null}
    </article>
  );
}
