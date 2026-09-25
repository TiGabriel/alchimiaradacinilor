"use client";

import { Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { AddToCartButton } from "@/features/cart/add-to-cart-button";
import { useCart } from "@/features/cart/cart-context";
import { WishlistButton } from "@/features/wishlist/wishlist-button";

type ProductPurchaseProps = { product: { id: string; name: string; stock: number } };

export function ProductPurchase({ product }: ProductPurchaseProps) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [buying, setBuying] = useState(false);
  const soldOut = product.stock <= 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={Math.max(1, product.stock)}
          disabled={soldOut}
          className="h-13"
        />
        <AddToCartButton
          product={product}
          quantity={quantity}
          size="lg"
          className="min-w-52 flex-1"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="accent"
          size="lg"
          className="flex-1"
          disabled={soldOut}
          loading={buying}
          onClick={async () => {
            setBuying(true);
            try {
              if (await addItem(product, quantity, { openDrawer: false })) router.push("/cos");
            } finally {
              setBuying(false);
            }
          }}
        >
          <Zap aria-hidden /> Cumpără acum
        </Button>
        <WishlistButton product={product} variant="inline" className="flex-1" />
      </div>
    </div>
  );
}
