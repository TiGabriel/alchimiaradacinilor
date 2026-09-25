"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo } from "react";

import { toast } from "@/components/ui/toast";

type CartContextValue = {
  /** Total quantity of items in the cart. */
  count: number;
  openCart: () => void;
  addItem: (product: { id: string; name: string }, quantity?: number) => Promise<boolean>;
  pending: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Phase 3 stub: the real cart (drawer, persistence) arrives in Phase 4. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const value = useMemo<CartContextValue>(
    () => ({
      count: 0,
      pending: false,
      openCart: () => router.push("/cos"),
      addItem: async (product) => {
        toast({ title: "Coșul va fi disponibil în curând", description: product.name });
        return false;
      },
    }),
    [router],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
