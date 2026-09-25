"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type WishlistContextValue = {
  count: number;
  has: (productId: string) => boolean;
  toggle: (product: { id: string; name: string }) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

/** Phase 3: UI-only (in-memory). Persistence and the /favorite page arrive in Phase 4. */
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  const toggle = useCallback((product: { id: string }) => {
    setIds((current) =>
      current.includes(product.id)
        ? current.filter((i) => i !== product.id)
        : [...current, product.id],
    );
  }, []);
  const value = useMemo(() => ({ count: ids.length, has, toggle }), [ids.length, has, toggle]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
