"use client";

import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";

import { useWishlist } from "./wishlist-context";

type WishlistButtonProps = {
  product: { id: string; name: string };
  variant?: "floating" | "inline";
  className?: string;
};

/** Heart toggle. `floating` sits on product images; `inline` is a full button with a label. */
export function WishlistButton({ product, variant = "floating", className }: WishlistButtonProps) {
  const { has, toggle } = useWishlist();
  const active = has(product.id);
  const label = active
    ? `Elimină ${product.name} din favorite`
    : `Adaugă ${product.name} la favorite`;

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={() => toggle(product)}
        aria-pressed={active}
        className={cn(
          "inline-flex h-13 items-center justify-center gap-2 rounded-full border border-line-strong px-6 font-semibold text-ink transition-colors hover:border-forest hover:text-forest",
          active && "border-clay/40 bg-clay-soft text-clay hover:border-clay hover:text-clay",
          className,
        )}
      >
        <Heart
          aria-hidden
          className={cn("size-5 transition-transform", active && "animate-pop fill-current")}
        />
        {active ? "În favorite" : "Adaugă la favorite"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(product);
      }}
      aria-pressed={active}
      aria-label={label}
      title={active ? "Elimină din favorite" : "Adaugă la favorite"}
      className={cn(
        "grid size-10 place-items-center rounded-full bg-surface/90 text-ink shadow-xs backdrop-blur-sm transition-[color,transform,background-color] hover:scale-105 hover:text-clay focus-visible:outline-2 focus-visible:outline-forest motion-reduce:hover:scale-100",
        active && "text-clay",
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn("size-[1.15rem]", active && "animate-pop fill-current")}
        strokeWidth={1.9}
      />
    </button>
  );
}
