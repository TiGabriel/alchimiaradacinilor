"use server";

import {
  CartError,
  addCartItem,
  applyCartCoupon,
  removeCartCoupon,
  getCartSuggestions,
  loadCartView,
  removeCartItem,
  setCartItemQuantity,
  type CartMutationResult,
  type CartView,
} from "@/services/cart/cart";
import type { ProductCardData } from "@/services/catalog/product-types";
import { limiters, retryAfterText } from "@/services/auth/rate-limit";
import { couponCodeSchema } from "@/validation/checkout";
import {
  addToCartSchema,
  productIdSchema,
  productIdsSchema,
  setQuantitySchema,
} from "@/validation/cart";

import { getRequestMeta } from "../auth/session";

import { getCartOwner, setGuestCartCookie } from "./owner";

export type CartActionResult =
  { ok: true; cart: CartView; notice: string | null } | { ok: false; error: string };

const GENERIC_ERROR = "Nu am putut actualiza coșul. Te rugăm să încerci din nou.";

async function run(mutation: () => Promise<CartMutationResult>): Promise<CartActionResult> {
  try {
    const { view, notice, token } = await mutation();
    if (token) await setGuestCartCookie(token);
    return { ok: true, cart: view, notice };
  } catch (error) {
    if (error instanceof CartError) return { ok: false, error: error.message };
    console.error("[cart]", error);
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function getCartAction(): Promise<CartView> {
  return loadCartView(await getCartOwner());
}

export async function addToCartAction(input: {
  productId: string;
  quantity?: number;
}): Promise<CartActionResult> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cantitate invalidă." };
  const owner = await getCartOwner();
  return run(() => addCartItem(owner, parsed.data.productId, parsed.data.quantity));
}

export async function setCartQuantityAction(input: {
  productId: string;
  quantity: number;
}): Promise<CartActionResult> {
  const parsed = setQuantitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Cantitate invalidă." };
  const owner = await getCartOwner();
  return run(() => setCartItemQuantity(owner, parsed.data.productId, parsed.data.quantity));
}

export async function removeFromCartAction(productId: string): Promise<CartActionResult> {
  const parsed = productIdSchema.safeParse(productId);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };
  const owner = await getCartOwner();
  return run(() => removeCartItem(owner, parsed.data));
}

export async function getCartSuggestionsAction(productIds: string[]): Promise<ProductCardData[]> {
  const parsed = productIdsSchema.safeParse(productIds);
  if (!parsed.success) return [];
  return getCartSuggestions(parsed.data, 3);
}

export async function applyCouponAction(code: string): Promise<CartActionResult> {
  const parsed = couponCodeSchema.safeParse(code);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Cod invalid." };
  const owner = await getCartOwner();
  const key = owner.userId ?? (await getRequestMeta()).ipHash;
  const limit = limiters.couponAttempts.check(`coupon:${key}`);
  if (!limit.allowed)
    return {
      ok: false,
      error: `Prea multe încercări. Mai încearcă peste ${retryAfterText(limit.retryAfterMs)}.`,
    };
  return run(() => applyCartCoupon(owner, parsed.data));
}

export async function removeCouponAction(): Promise<CartActionResult> {
  const owner = await getCartOwner();
  return run(() => removeCartCoupon(owner));
}
