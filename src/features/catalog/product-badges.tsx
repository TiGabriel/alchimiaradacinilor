import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProductCardData } from "@/services/catalog/product-types";

/** Badges stacked on a product image. */
export function ProductBadges({
  product,
  className,
}: {
  product: Pick<ProductCardData, "isNew" | "hasDoterraLink">;
  className?: string;
}) {
  if (!product.isNew && !product.hasDoterraLink) return null;
  return (
    <div className={cn("pointer-events-none flex flex-col items-start gap-1.5", className)}>
      {product.hasDoterraLink ? (
        <Badge variant="sage" size="sm">
          Pe doTERRA
        </Badge>
      ) : null}
      {product.isNew ? (
        <Badge variant="forest" size="sm">
          Nou
        </Badge>
      ) : null}
    </div>
  );
}
