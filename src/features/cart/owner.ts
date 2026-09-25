import "server-only";
import { cookies } from "next/headers";

import { GUEST_CART_TTL_DAYS, type CartOwner } from "@/services/cart/cart";

import { getCurrentUser } from "../auth/session";

export const CART_COOKIE = "ar_cart";

/** Signed-in customers own their cart by user id; guests by an opaque cookie token. */
export async function getCartOwner(): Promise<CartOwner> {
  const user = await getCurrentUser();
  if (user) return { userId: user.id, token: null };
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
