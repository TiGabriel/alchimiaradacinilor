import "server-only";
import { cookies } from "next/headers";

import { GUEST_CART_TTL_DAYS, type CartOwner } from "@/services/cart/cart";

export const CART_COOKIE = "ar_cart";

/** Resolves the current cart owner. The signed-in user is added in the auth phase. */
export async function getCartOwner(): Promise<CartOwner> {
  const jar = await cookies();
  const token = jar.get(CART_COOKIE)?.value ?? null;
  return { userId: null, token: token && /^[A-Za-z0-9_-]{16,64}$/.test(token) ? token : null };
}

export async function setGuestCartCookie(token: string) {
  const jar = await cookies();
  jar.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GUEST_CART_TTL_DAYS * 24 * 60 * 60,
  });
}
