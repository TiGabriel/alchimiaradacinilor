import "server-only";
import { randomBytes } from "node:crypto";

import type { ProductType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getProductCards } from "@/services/catalog/products";
import type { ProductCardData } from "@/services/catalog/product-types";
import { getSimilarityProfiles } from "@/services/catalog/product-detail";
import { rankSimilar } from "@/services/catalog/similarity";
import { getSetting } from "@/services/settings";

import { buildQuote } from "../checkout/quote";
import { evaluateCouponFor, findCouponByCode } from "../coupons/coupons";

import {
  calculateLine,
  clampLineQuantity,
  type CalculatedLine,
  type CartLineInput,
} from "./calculate";
import { mergeCartItems } from "./merge";

/** Who owns a cart: a signed-in user, or a guest identified by an opaque cookie token. */
export type CartOwner = { userId: string | null; token: string | null };

export const GUEST_CART_TTL_DAYS = 60;

export type CartLineData = CartLineInput & {
  categoryId: string;
  slug: string;
  name: string;
  brandName: string | null;
  productType: ProductType;
  image: { url: string; alt: string | null } | null;
  tone: string | null;
};

export type CartLineView = CalculatedLine<CartLineData>;

/** Serializable cart snapshot sent to the client. Every number is recomputed server-side. */
export type CartView = {
  lines: CartLineView[];
  itemCount: number;
  subtotal: number;
  discount: number;
  discounts: Array<{ label: string; amount: number }>;
  shipping: number;
  freeShipping: boolean;
  freeShippingRemaining: number | null;
  freeShippingThreshold: number | null;
  /** Delivery method the totals use (the first active one unless checkout chose another). */
  shippingMethodCode: string;
  shippingMethodName: string;
  total: number;
  /** VAT included in the total. */
  tax: number;
  /** The code attached to the cart; `message` explains why it does not apply (yet). */
  coupon: { code: string; label: string; applied: boolean; message: string | null } | null;
  hasIssues: boolean;
};

export class CartError extends Error {}

export function newGuestToken(): string {
  return randomBytes(24).toString("base64url");
}

function guestExpiry() {
  return new Date(Date.now() + GUEST_CART_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function ownerWhere(owner: CartOwner) {
  if (owner.userId) return { userId: owner.userId };
  if (owner.token) return { token: owner.token };
  return null;
}

const lineInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          active: true,
          categoryId: true,
          productType: true,
          brand: { select: { name: true } },
          images: {
            orderBy: { position: "asc" },
            take: 1,
            select: { alt: true, media: { select: { url: true, alt: true } } },
          },
          aromaProfiles: {
            orderBy: { intensity: "desc" },
            take: 1,
            select: { aromaProfile: { select: { colorHex: true } } },
          },
        },
      },
    },
  },
} as const;

async function findCart(owner: CartOwner) {
  const where = ownerWhere(owner);
  if (!where) return null;
  const cart = await db.cart.findFirst({ where, include: lineInclude });
  if (cart && !owner.userId && cart.expiresAt && cart.expiresAt < new Date()) return null;
  return cart;
}

type LoadedCart = NonNullable<Awaited<ReturnType<typeof findCart>>>;

export function toCartLines(cart: Pick<LoadedCart, "items"> | null): CartLineData[] {
  return (cart?.items ?? []).map(({ product: p, quantity }) => ({
    productId: p.id,
    categoryId: p.categoryId,
    quantity,
    unitPrice: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    available: p.active,
    slug: p.slug,
    name: p.name,
    brandName: p.brand?.name ?? null,
    productType: p.productType,
    image: p.images[0]
      ? { url: p.images[0].media.url, alt: p.images[0].alt ?? p.images[0].media.alt }
      : null,
    tone: p.aromaProfiles[0]?.aromaProfile.colorHex ?? null,
  }));
}

async function customerOf(userId: string | null) {
  if (!userId) return null;
  const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
  return user ? { userId, email: user.email } : null;
}

async function toView(cart: LoadedCart | null, methodCode?: string | null): Promise<CartView> {
  const quote = await buildQuote(toCartLines(cart), {
    couponId: cart?.couponId ?? null,
    customer: await customerOf(cart?.userId ?? null),
    methodCode,
  });
  const shipping = await getSetting("shipping");
  const { tax, couponApplied, ...totals } = quote.pricing;
  const method = quote.pricedMethod;
  return {
    ...totals,
    tax,
    freeShippingThreshold: method.freeShippingEligible ? shipping.freeShippingThreshold : null,
    shippingMethodCode: method.code,
    shippingMethodName: method.name,
    coupon: quote.coupon
      ? {
          code: quote.coupon.code,
          label: quote.coupon.label,
          applied: couponApplied,
          message: quote.coupon.check.ok
            ? couponApplied
              ? null
              : "Codul nu aduce o reducere pentru metoda de livrare aleasă."
            : quote.coupon.check.message,
        }
      : null,
  };
}

/** The cart priced for a delivery method (default: the first active one). */
export async function loadCartView(
  owner: CartOwner,
  options: { methodCode?: string | null } = {},
): Promise<CartView> {
  return toView(await findCart(owner), options.methodCode);
}

/** Returns the owner's cart id, creating the cart (and a guest token) when needed. */
async function ensureCart(owner: CartOwner): Promise<{ cartId: string; token: string | null }> {
  const existing = await findCart(owner);
  if (existing) {
    if (!owner.userId)
      await db.cart.update({ where: { id: existing.id }, data: { expiresAt: guestExpiry() } });
    return { cartId: existing.id, token: owner.token };
  }
  if (owner.userId) {
    const cart = await db.cart.upsert({
      where: { userId: owner.userId },
      create: { userId: owner.userId },
      update: {},
    });
    return { cartId: cart.id, token: null };
  }
  const token = newGuestToken();
  const cart = await db.cart.create({ data: { token, expiresAt: guestExpiry() } });
  return { cartId: cart.id, token };
}

async function loadProductForCart(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { id: true, name: true, stock: true, active: true },
  });
  if (!product || !product.active) throw new CartError("Produsul nu mai este disponibil.");
  return product;
}

export type CartMutationResult = { view: CartView; notice: string | null; token: string | null };

/** Adds `quantity` to the line (never above stock). */
export async function addCartItem(
  owner: CartOwner,
  productId: string,
  quantity: number,
): Promise<CartMutationResult> {
  const product = await loadProductForCart(productId);
  if (product.stock <= 0) throw new CartError(`${product.name} nu mai este în stoc.`);

  const { cartId, token } = await ensureCart(owner);
  const existing = await db.cartItem.findUnique({
    where: { cartId_productId: { cartId, productId } },
  });
  const requested = (existing?.quantity ?? 0) + quantity;
  const allowed = clampLineQuantity(requested, product.stock);

  await db.cartItem.upsert({
    where: { cartId_productId: { cartId, productId } },
    create: { cartId, productId, quantity: allowed },
    update: { quantity: allowed },
  });

  const notice =
    allowed < requested
      ? `Am ajustat cantitatea pentru ${product.name} la ${allowed} — atât avem în stoc.`
      : null;
  return {
    view: await toView(await findCart({ ...owner, token: token ?? owner.token })),
    notice,
    token,
  };
}

/** Sets an exact quantity; 0 removes the line. */
export async function setCartItemQuantity(
  owner: CartOwner,
  productId: string,
  quantity: number,
): Promise<CartMutationResult> {
  const cart = await findCart(owner);
  if (!cart) return { view: await toView(null), notice: null, token: null };
  if (quantity <= 0) return removeCartItem(owner, productId);

  const product = await loadProductForCart(productId);
  const allowed = clampLineQuantity(quantity, product.stock);
  if (allowed === 0) throw new CartError(`${product.name} nu mai este în stoc.`);
  // updateMany: the line may already be gone (e.g. removed in another tab) — then it is a no-op.
  await db.cartItem.updateMany({
    where: { cartId: cart.id, productId },
    data: { quantity: allowed },
  });
  const notice =
    allowed < quantity ? `Avem doar ${allowed} buc. din ${product.name} în stoc.` : null;
  return { view: await toView(await findCart(owner)), notice, token: null };
}

export async function removeCartItem(
  owner: CartOwner,
  productId: string,
): Promise<CartMutationResult> {
  const cart = await findCart(owner);
  if (cart) await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  return { view: await toView(await findCart(owner)), notice: null, token: null };
}

/**
 * Moves a guest cart into the user's cart (sums quantities, capped per line)
 * and deletes the guest cart. Called after login (auth phase).
 */
export async function mergeGuestCartIntoUser(guestToken: string, userId: string): Promise<void> {
  await db.$transaction(async (tx) => {
    const guest = await tx.cart.findUnique({
      where: { token: guestToken },
      include: { items: true },
    });
    if (!guest || guest.userId) return;
    const account = await tx.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { items: true },
    });
    const merged = mergeCartItems(account.items, guest.items);
    for (const item of merged) {
      await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: account.id, productId: item.productId } },
        create: { cartId: account.id, productId: item.productId, quantity: item.quantity },
        update: { quantity: item.quantity },
      });
    }
    // A code applied as a guest carries over unless the account cart already has one.
    if (guest.couponId && !account.couponId)
      await tx.cart.update({ where: { id: account.id }, data: { couponId: guest.couponId } });
    await tx.cart.delete({ where: { id: guest.id } });
  });
}

/** Gentle complementary suggestions for the products already in the cart. */
export async function getCartSuggestions(
  productIds: string[],
  limit = 3,
): Promise<ProductCardData[]> {
  if (productIds.length === 0) return [];
  const profiles = await getSimilarityProfiles();
  const sources = profiles.filter((p) => productIds.includes(p.id));
  return getProductCards(rankSimilar(sources, profiles, { limit, exclude: productIds }));
}

/**
 * Attaches a coupon to the cart after checking it against the current lines.
 * An invalid code is never attached; the error says why.
 */
export async function applyCartCoupon(
  owner: CartOwner,
  rawCode: string,
): Promise<CartMutationResult> {
  const cart = await findCart(owner);
  if (!cart || cart.items.length === 0)
    throw new CartError("Adaugă produse în coș înainte de a aplica un cod.");
  const coupon = await findCouponByCode(rawCode);
  if (!coupon) throw new CartError("Codul nu există sau nu mai este activ.");
  const lines = toCartLines(cart).map(calculateLine);
  const evaluated = await evaluateCouponFor(
    coupon,
    lines.map((l) => ({
      productId: l.productId,
      categoryId: l.categoryId,
      lineTotal: l.lineTotal,
    })),
    await customerOf(owner.userId),
  );
  if (!evaluated.check.ok) throw new CartError(evaluated.check.message);
  await db.cart.update({ where: { id: cart.id }, data: { couponId: coupon.id } });
  return {
    view: await toView(await findCart(owner)),
    notice: `Codul ${coupon.code} a fost aplicat.`,
    token: null,
  };
}

export async function removeCartCoupon(owner: CartOwner): Promise<CartMutationResult> {
  const cart = await findCart(owner);
  if (cart?.couponId) await db.cart.update({ where: { id: cart.id }, data: { couponId: null } });
  return { view: await toView(await findCart(owner)), notice: null, token: null };
}
