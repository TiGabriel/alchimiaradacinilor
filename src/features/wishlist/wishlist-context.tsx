"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

import { toast } from "@/components/ui/toast";

import {
  getWishlistServerSnapshot,
  getWishlistSnapshot,
  subscribeWishlist,
  toggleId,
  writeWishlist,
} from "./wishlist-store";

type WishlistContextValue = {
  ids: readonly string[];
  count: number;
  has: (productId: string) => boolean;
  toggle: (product: { id: string; name: string }) => void;
  remove: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Guests: stored in this browser (localStorage). Signed-in customers get a
 * DB-backed wishlist in the auth phase, merged via mergeLocalWishlistIntoUser().
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ids = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getWishlistServerSnapshot,
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const remove = useCallback(
    (id: string) => writeWishlist(getWishlistSnapshot().filter((i) => i !== id)),
    [],
  );

  const toggle = useCallback(
    (product: { id: string; name: string }) => {
      const current = getWishlistSnapshot();
      const adding = !current.includes(product.id);
      writeWishlist(toggleId(current, product.id));
      toast(
        adding
          ? {
              title: "Adăugat la favorite",
              description: product.name,
              action: { label: "Vezi favoritele", onClick: () => router.push("/favorite") },
            }
          : {
              title: "Eliminat din favorite",
              description: product.name,
              action: {
                label: "Anulează",
                onClick: () => writeWishlist(toggleId(getWishlistSnapshot(), product.id)),
              },
            },
      );
    },
    [router],
  );

  const value = useMemo(
    () => ({ ids, count: ids.length, has, toggle, remove }),
    [ids, has, toggle, remove],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
