import { Badge } from "@/components/ui/badge";
import { discountPercent } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/services/catalog/product-types";

/** Badges stacked on a product image: discount, new, sold out, demo. */
export function ProductBadges({
  product,
  className,
}: {
  product: Pick<ProductCardData, "price" | "compareAtPrice" | "isNew" | "stock" | "isDemo">;
  className?: string;
}) {
  const discount = discountPercent(product.price, product.compareAtPrice);
  return (
    <div className={cn("pointer-events-none flex flex-col items-start gap-1.5", className)}>
      {product.stock <= 0 ? (
        <Badge variant="neutral" size="sm">
          Stoc epuizat
        </Badge>
      ) : null}
      {discount ? (
        <Badge variant="clay" size="sm">
          −{discount}%
        </Badge>
      ) : null}
      {product.isNew ? (
        <Badge variant="forest" size="sm">
          Nou
        </Badge>
      ) : null}
      {product.isDemo ? (
        <Badge variant="demo" size="sm" title="Produs demonstrativ">
          Demo
        </Badge>
      ) : null}
    </div>
  );
}
