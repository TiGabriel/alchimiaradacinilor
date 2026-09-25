"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo } from "react";

type CartContextValue = {
  /** Total quantity of items in the cart. */
  count: number;
  openCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Phase 2 stub: the real cart (drawer, persistence) arrives in Phase 4. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const value = useMemo<CartContextValue>(
    () => ({ count: 0, openCart: () => router.push("/cos") }),
    [router],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
