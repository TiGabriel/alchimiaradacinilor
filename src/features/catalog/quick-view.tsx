"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/media/product-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Price } from "@/components/ui/price";
import { RatingStars } from "@/components/ui/rating-stars";
import { productHref, type ProductCardData } from "@/services/catalog/product-types";

import { DoterraButton } from "./doterra-button";

type QuickViewProps = {
  product: ProductCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickView({ product, open, onOpenChange }: QuickViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="p-0 sm:p-0">
        <div className="grid sm:grid-cols-2">
          <div className="overflow-hidden sm:rounded-l-xl">
            <ProductImage
              name={product.name}
              productType={product.productType}
              image={product.images[0]}
              tone={product.tone}
              sizes="(min-width: 640px) 380px, 100vw"
              className="max-sm:aspect-[4/3]"
            />
          </div>
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            {product.brandName ? (
              <p className="text-eyebrow text-ink-muted">{product.brandName}</p>
            ) : null}
            <DialogTitle className="text-3xl">{product.name}</DialogTitle>
            {product.rating != null ? (
              <RatingStars value={product.rating} count={product.reviewCount} showValue />
            ) : null}
            <div className="flex flex-col gap-0.5">
              <Price price={product.price} size="lg" />
              <span className="text-xs text-ink-muted">Preț pe site-ul doTERRA</span>
            </div>
            <DialogDescription>{product.shortDescription}</DialogDescription>
            <div className="mt-auto flex flex-col gap-3 pt-2">
              <DoterraButton product={product} source="previzualizare" block note />
              <Button asChild variant="outline" block>
                <Link href={productHref(product)} onClick={() => onOpenChange(false)}>
                  Vezi detalii <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
