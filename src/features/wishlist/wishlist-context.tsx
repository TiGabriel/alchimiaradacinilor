"use client";

import { createContext, useContext } from "react";

type WishlistContextValue = { count: number };

const WishlistContext = createContext<WishlistContextValue | null>(null);

/** Phase 2 stub: the real wishlist arrives in Phase 4. */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  return <WishlistContext.Provider value={{ count: 0 }}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
