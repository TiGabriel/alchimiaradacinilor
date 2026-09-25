"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { toast } from "@/components/ui/toast";
import { track } from "@/lib/analytics/client";

import { useSession } from "../auth/session-context";

import {
  getAccountWishlistAction,
  mergeWishlistAction,
  toggleAccountWishlistAction,
} from "./actions";
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
  /** Where the list is kept: this browser (guest) or the account. */
  storage: "browser" | "account";
  has: (productId: string) => boolean;
  toggle: (product: { id: string; name: string }) => void;
  remove: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/**
 * Guests: localStorage. Signed in: the account's wishlist in the DB. On the
 * first load after sign-in, the browser's items are merged into the account
 * and the local copy is cleared.
 */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useSession();
  const localIds = useSyncExternalStore(
    subscribeWishlist,
    getWishlistSnapshot,
    getWishlistServerSnapshot,
  );
  const [accountIds, setAccountIds] = useState<readonly string[] | null>(null);
  const signedIn = Boolean(user);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    const local = getWishlistSnapshot();
    (local.length ? mergeWishlistAction([...local]) : getAccountWishlistAction())
      .then((ids) => {
        if (cancelled || !ids) return;
        setAccountIds(ids);
        if (local.length) writeWishlist([]);
      })
      .catch((error: unknown) => console.error("[wishlist] load failed", error));
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const ids = useMemo<readonly string[]>(
    () => (signedIn ? (accountIds ?? []) : localIds),
    [signedIn, accountIds, localIds],
  );
  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const apply = useCallback(
    async (productId: string) => {
      if (signedIn) {
        // Optimistic update, then reconcile with the server's list.
        setAccountIds((current) => toggleId(current ?? [], productId));
        const next = await toggleAccountWishlistAction(productId);
        if (next) setAccountIds(next);
      } else {
        writeWishlist(toggleId(getWishlistSnapshot(), productId));
      }
    },
    [signedIn],
  );

  const toggle = useCallback(
    (product: { id: string; name: string }) => {
      const adding = !ids.includes(product.id);
      void apply(product.id);
      if (adding) track("wishlist_add", { productId: product.id });
      toast(
        adding
          ? {
              title: "Adăugat la favorite",
              description: product.name,
              action: {
                label: "Vezi favoritele",
                onClick: () => router.push(signedIn ? "/cont/favorite" : "/favorite"),
              },
            }
          : {
              title: "Eliminat din favorite",
              description: product.name,
              action: { label: "Anulează", onClick: () => void apply(product.id) },
            },
      );
    },
    [apply, ids, router, signedIn],
  );

  const remove = useCallback(
    (productId: string) => {
      if (ids.includes(productId)) void apply(productId);
    },
    [apply, ids],
  );

  const value = useMemo<WishlistContextValue>(
    () => ({
      ids,
      count: ids.length,
      storage: signedIn ? "account" : "browser",
      has,
      toggle,
      remove,
    }),
    [ids, signedIn, has, toggle, remove],
  );
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
