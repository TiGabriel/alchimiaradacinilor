"use client";

import { Heart, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductGridSkeleton } from "@/components/states/skeletons";
import { DoterraButton } from "@/features/catalog/doterra-button";
import { ProductCard } from "@/features/catalog/product-card";
import { pluralRo } from "@/lib/plural";
import type { ProductCardData } from "@/services/catalog/product-types";

import { getWishlistProductsAction } from "./actions";
import { useWishlist } from "./wishlist-context";

function EmptyHeart() {
  return (
    <div className="grid size-full place-items-center rounded-full bg-clay-soft text-clay">
      <Heart aria-hidden className="size-1/3" strokeWidth={1.5} />
    </div>
  );
}

export function FavoritesView() {
  const { ids, remove, storage } = useWishlist();
  const [loaded, setLoaded] = useState<{ key: string; products: ProductCardData[] } | null>(null);
  const key = ids.join(",");

  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split(",") : [];
    (list.length ? getWishlistProductsAction(list) : Promise.resolve([]))
      .then((products) => {
        if (!cancelled) setLoaded({ key, products });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, products: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  // Keep showing the previous list while a removal re-fetches; drop removed ids immediately.
  const products = (loaded?.products ?? []).filter((p) => ids.includes(p.id));

  if (loaded === null) return <ProductGridSkeleton count={4} />;

  if (products.length === 0) {
    return (
      <EmptyState
        size="lg"
        illustration={<EmptyHeart />}
        title="Încă nu ai salvat niciun produs."
        description="Apasă pe inimioara de pe orice produs pentru a-l păstra aici și a reveni la el oricând."
        actions={
          <Button asChild>
            <Link href="/produse">Descoperă produsele</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ink-muted" aria-live="polite">
        {pluralRo(products.length, "produs salvat", "produse salvate")} ·{" "}
        {storage === "account" ? "salvate în contul tău" : "păstrate în acest browser"}
      </p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {products.map((product) => (
          <li key={product.id} className="flex flex-col gap-3">
            <ProductCard product={product} />
            <DoterraButton product={product} source="favorite" size="sm" block />
            <Button size="sm" variant="ghost" onClick={() => remove(product.id)}>
              <X aria-hidden /> Elimină din favorite
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
