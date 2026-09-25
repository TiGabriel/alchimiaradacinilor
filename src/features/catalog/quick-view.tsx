"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ProductImage } from "@/components/media/product-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Price } from "@/components/ui/price";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { RatingStars } from "@/components/ui/rating-stars";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import {
  productHref,
  stockLabel,
  stockStatus,
  type ProductCardData,
} from "@/services/catalog/product-types";

type QuickViewProps = {
  product: ProductCardData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function QuickView({ product, open, onOpenChange }: QuickViewProps) {
  const [quantity, setQuantity] = useState(1);
  const status = stockStatus(product.stock);

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
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            <DialogDescription>{product.shortDescription}</DialogDescription>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  status === "in-stock" ? "success" : status === "low-stock" ? "warning" : "danger"
                }
                size="sm"
              >
                {stockLabel(product.stock)}
              </Badge>
              {product.isDemo ? (
                <Badge variant="demo" size="sm">
                  Produs demonstrativ
                </Badge>
              ) : null}
            </div>
            <div className="mt-auto flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  max={Math.max(1, product.stock)}
                  disabled={product.stock <= 0}
                />
                <AddToCartButton
                  product={product}
                  quantity={quantity}
                  className="flex-1"
                  onAdded={() => onOpenChange(false)}
                />
              </div>
              <Button asChild variant="link" className="self-start">
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
