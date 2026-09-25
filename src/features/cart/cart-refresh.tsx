"use client";

import { useEffect, useRef } from "react";

import { getCartAction } from "./actions";
import { useCart } from "./cart-context";

/** Re-reads the cart once after a server-side change the client did not make (e.g. an order emptied it). */
export function CartRefresh() {
  const { applyCart } = useCart();
  // applyCart changes identity with every cart update; read it through a ref so this runs once.
  const apply = useRef(applyCart);
  useEffect(() => {
    apply.current = applyCart;
  }, [applyCart]);

  useEffect(() => {
    let active = true;
    void getCartAction().then((view) => {
      if (active) apply.current(view, { openDrawer: false });
    });
    return () => {
      active = false;
    };
  }, []);
  return null;
}
