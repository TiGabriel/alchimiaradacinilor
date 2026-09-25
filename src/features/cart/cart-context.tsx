"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { toast } from "@/components/ui/toast";
import type { CartView } from "@/services/cart/cart";

import {
  addToCartAction,
  getCartAction,
  removeFromCartAction,
  setCartQuantityAction,
  type CartActionResult,
} from "./actions";
import { CartDrawer } from "./cart-drawer";

type AddOptions = { openDrawer?: boolean };

type CartContextValue = {
  /** null while the cart is loading. */
  cart: CartView | null;
  /** Purchasable items in the cart. */
  count: number;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  openCart: () => void;
  /** Product ids with a request in flight. */
  pendingIds: ReadonlySet<string>;
  addItem: (
    product: { id: string; name: string },
    quantity?: number,
    options?: AddOptions,
  ) => Promise<boolean>;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (product: { id: string; name: string }) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    getCartAction()
      .then((view) => {
        if (!cancelled) setCart(view);
      })
      // Usually an aborted request during a full-page navigation; the next page load retries.
      .catch((error: unknown) => console.warn("[cart] load failed", error));
    return () => {
      cancelled = true;
    };
  }, []);

  const withPending = useCallback(
    async (productId: string, run: () => Promise<CartActionResult>) => {
      setPendingIds((s) => new Set(s).add(productId));
      try {
        const result = await run();
        if (result.ok) {
          setCart(result.cart);
          if (result.notice) toast({ title: "Cantitate ajustată", description: result.notice });
        } else {
          toast({ title: result.error, variant: "error" });
        }
        return result;
      } catch (error) {
        console.error("[cart]", error);
        toast({
          title: "Nu am putut actualiza coșul",
          description: "Verifică conexiunea și încearcă din nou.",
          variant: "error",
        });
        return { ok: false as const, error: "network" };
      } finally {
        setPendingIds((s) => {
          const next = new Set(s);
          next.delete(productId);
          return next;
        });
      }
    },
    [],
  );

  const addItem = useCallback<CartContextValue["addItem"]>(
    async (product, quantity = 1, options) => {
      const result = await withPending(product.id, () =>
        addToCartAction({ productId: product.id, quantity }),
      );
      if (result.ok && options?.openDrawer !== false) setDrawerOpen(true);
      return result.ok;
    },
    [withPending],
  );

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    async (productId, quantity) => {
      await withPending(productId, () => setCartQuantityAction({ productId, quantity }));
    },
    [withPending],
  );

  const removeItem = useCallback<CartContextValue["removeItem"]>(
    async (product) => {
      const previous = cart?.lines.find((l) => l.productId === product.id)?.requestedQuantity ?? 1;
      const result = await withPending(product.id, () => removeFromCartAction(product.id));
      if (result.ok) {
        toast({
          title: "Produs eliminat din coș",
          description: product.name,
          action: {
            label: "Anulează",
            onClick: () =>
              void withPending(product.id, () =>
                addToCartAction({ productId: product.id, quantity: previous }),
              ),
          },
        });
      }
    },
    [cart, withPending],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      count: cart?.itemCount ?? 0,
      drawerOpen,
      setDrawerOpen,
      openCart: () => setDrawerOpen(true),
      pendingIds,
      addItem,
      setQuantity,
      removeItem,
    }),
    [cart, drawerOpen, pendingIds, addItem, setQuantity, removeItem],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
