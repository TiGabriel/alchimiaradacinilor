"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductImage } from "@/components/media/product-image";
import { formatMoney } from "@/lib/money";
import { productHref, type ProductCardData } from "@/services/catalog/product-types";

import { getCartSuggestionsAction } from "./actions";
import { useCart } from "./cart-context";

export const SUGGESTIONS_TITLE = "Se potrivește bine cu produsul tău";

/** Suggestions for the current cart contents (re-fetched when the product set changes). */
export function useCartSuggestions(): ProductCardData[] {
  const { cart } = useCart();
  const [items, setItems] = useState<ProductCardData[]>([]);
  const key = (cart?.lines ?? [])
    .map((l) => l.productId)
    .sort()
    .join(",");

  useEffect(() => {
    let cancelled = false;
    const ids = key ? key.split(",") : [];
    const request = ids.length ? getCartSuggestionsAction(ids) : Promise.resolve([]);
    request
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return items;
}

/** Compact, gentle suggestion list for the drawer. */
export function CartSuggestionsCompact({ onNavigate }: { onNavigate?: () => void }) {
  const { addItem, pendingIds } = useCart();
  const items = useCartSuggestions();
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="cart-suggestions"
      className="flex flex-col gap-3 border-t border-line pt-5"
    >
      <h3 id="cart-suggestions" className="font-display text-lg">
        {SUGGESTIONS_TITLE}
      </h3>
      <ul className="flex flex-col gap-3">
        {items.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <Link
              href={productHref(p)}
              onClick={onNavigate}
              className="w-14 shrink-0 overflow-hidden rounded-md"
              tabIndex={-1}
              aria-hidden
            >
              <ProductImage
                name={p.name}
                productType={p.productType}
                image={p.images[0]}
                tone={p.tone}
                aspect="square"
                sizes="56px"
              />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={productHref(p)}
                onClick={onNavigate}
                className="truncate font-semibold hover:text-forest"
              >
                {p.name}
              </Link>
              <span className="text-sm text-ink-muted">{formatMoney(p.price)}</span>
            </div>
            <button
              type="button"
              onClick={() => addItem(p, 1, { openDrawer: false })}
              disabled={pendingIds.has(p.id)}
              className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-line-strong px-3 text-sm font-semibold transition-colors hover:border-forest hover:text-forest disabled:opacity-50"
              aria-label={`Adaugă ${p.name} în coș`}
            >
              <Plus aria-hidden className="size-4" /> Adaugă
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
