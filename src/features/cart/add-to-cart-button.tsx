"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

import { useCart } from "./cart-context";

type AddToCartButtonProps = Omit<ButtonProps, "onClick" | "children"> & {
  product: { id: string; name: string; stock: number };
  quantity?: number;
  label?: string;
  /** Called after a successful add (e.g. close a quick view, go to cart). */
  onAdded?: () => void;
  showIcon?: boolean;
};

export function AddToCartButton({
  product,
  quantity = 1,
  label = "Adaugă în coș",
  onAdded,
  showIcon = true,
  ...props
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);
  const soldOut = product.stock <= 0;

  return (
    <Button
      {...props}
      disabled={soldOut || props.disabled}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          if (await addItem(product, quantity)) onAdded?.();
        } finally {
          setBusy(false);
        }
      }}
    >
      {showIcon ? <ShoppingBag aria-hidden /> : null}
      {soldOut ? "Stoc epuizat" : label}
    </Button>
  );
}
