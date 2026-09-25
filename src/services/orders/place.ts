import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { AddressType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getSettings } from "@/services/settings";
import type { AddressInput } from "@/validation/address";
import type { CheckoutInput } from "@/validation/checkout";

import { toCartLines, type CartLineData } from "../cart/cart";
import { buildQuote, type Quote } from "../checkout/quote";
import { providerFor, type PaymentStart } from "../payments/methods";

import { sendOrderConfirmation } from "./notifications";
import { formatOrderNumber } from "./status";

export type CheckoutErrorCode =
  | "unverified"
  | "empty"
  | "stock"
  | "shipping"
  | "payment"
  | "coupon"
  | "address"
  | "price-changed";

export class CheckoutError extends Error {
  constructor(
    message: string,
    readonly code: CheckoutErrorCode,
  ) {
    super(message);
  }
}

type Tx = Prisma.TransactionClient;

const addressFields = {
  firstName: true,
  lastName: true,
  phone: true,
  companyName: true,
  vatNumber: true,
  tradeRegisterNo: true,
  street: true,
  streetExtra: true,
  city: true,
  county: true,
  postalCode: true,
  country: true,
} as const;

type AddressSnapshot = Prisma.AddressGetPayload<{ select: typeof addressFields }>;

function snapshotFromInput(a: AddressInput): AddressSnapshot {
  return {
    firstName: a.firstName,
    lastName: a.lastName,
    phone: a.phone,
    companyName: a.companyName ?? null,
    vatNumber: a.vatNumber ?? null,
    tradeRegisterNo: a.tradeRegisterNo ?? null,
    street: a.street,
    streetExtra: a.streetExtra ?? null,
    city: a.city,
    county: a.county,
    postalCode: a.postalCode,
    country: "RO",
  };
}

async function savedAddress(tx: Tx, userId: string, addressId: string) {
  const address = await tx.address.findFirst({
    where: { id: addressId, userId },
    select: addressFields,
  });
  if (!address) throw new CheckoutError("Adresa aleasă nu mai există. Alege alta.", "address");
  return address;
}

/** Year in the shop's time zone (order numbers restart every January 1st, Bucharest time). */
function shopYear(now = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Bucharest" }).format(now),
  );
}

async function nextOrderNumber(tx: Tx): Promise<string> {
  const year = shopYear();
  const [row] = await tx.$queryRaw<Array<{ value: number }>>`
    INSERT INTO order_counters ("year", "value") VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "value" = order_counters."value" + 1
    RETURNING "value"`;
  return formatOrderNumber(year, row!.value);
}

const cartInclude = {
  items: {
    orderBy: { createdAt: "asc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          sku: true,
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
} satisfies Prisma.CartInclude;

export type PlacedOrder = { id: string; number: string; payment: PaymentStart };

/**
 * Places an order from the customer's cart in one transaction:
 * re-prices everything from the database, re-checks stock, delivery, payment
 * and coupon, decrements stock atomically, snapshots items/addresses/prices,
 * records the coupon use and the first status, then empties the cart.
 * Any failure rolls everything back.
 */
export async function placeOrder(userId: string, input: CheckoutInput): Promise<PlacedOrder> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, emailVerifiedAt: true },
  });
  if (!user?.emailVerifiedAt)
    throw new CheckoutError("Confirmă adresa de email înainte de a plasa comanda.", "unverified");

  const settings = await getSettings();
  const provider = providerFor(input.paymentMethod);
  if (!provider || !provider.isAvailable(settings.payment))
    throw new CheckoutError("Metoda de plată aleasă nu este disponibilă.", "payment");

  const order = await db.$transaction(
    async (tx) => {
      // Lock the cart: a double submit waits here, then finds the cart empty.
      const [locked] = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM carts WHERE "userId" = ${userId} FOR UPDATE`;
      if (!locked) throw new CheckoutError("Coșul tău este gol.", "empty");
      const cart = await tx.cart.findUniqueOrThrow({
        where: { id: locked.id },
        include: cartInclude,
      });
      if (cart.items.length === 0) throw new CheckoutError("Coșul tău este gol.", "empty");

      // Serialise uses of the same coupon so usage limits hold under concurrency.
      if (cart.couponId)
        await tx.$queryRaw`SELECT id FROM coupons WHERE id = ${cart.couponId} FOR UPDATE`;

      const lines = toCartLines(cart);
      const quote: Quote<CartLineData> = await buildQuote(lines, {
        couponId: cart.couponId,
        customer: { userId: user.id, email: user.email },
        methodCode: input.shippingMethod,
        client: tx,
      });
      const { pricing, method, coupon } = quote;

      const problem = pricing.lines.find((l) => l.issue !== null);
      if (problem)
        throw new CheckoutError(
          problem.issue === "quantity-reduced"
            ? `Avem doar ${problem.quantity} buc. din ${problem.name} în stoc. Verifică coșul.`
            : `${problem.name} nu mai este disponibil. Scoate-l din coș pentru a continua.`,
          "stock",
        );
      if (!method)
        throw new CheckoutError("Metoda de livrare aleasă nu mai este disponibilă.", "shipping");
      if (coupon && !coupon.check.ok) throw new CheckoutError(coupon.check.message, "coupon");
      if (pricing.total !== input.expectedTotal)
        throw new CheckoutError(
          "Totalul comenzii s-a modificat între timp. Verifică sumarul actualizat și trimite din nou.",
          "price-changed",
        );

      // Atomic, conditional decrement: never below zero, even with concurrent orders.
      for (const line of pricing.lines) {
        const { count } = await tx.product.updateMany({
          where: { id: line.productId, active: true, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });
        if (count !== 1)
          throw new CheckoutError(
            `${line.name} tocmai s-a epuizat. Verifică coșul și încearcă din nou.`,
            "stock",
          );
      }

      const shippingAddress =
        input.shipping.kind === "saved"
          ? await savedAddress(tx, user.id, input.shipping.addressId)
          : snapshotFromInput(input.shipping.address);
      const billingAddress =
        input.billing.kind === "same"
          ? shippingAddress
          : input.billing.kind === "saved"
            ? await savedAddress(tx, user.id, input.billing.addressId)
            : snapshotFromInput(input.billing.address);

      if (input.shipping.kind === "new" && input.shipping.save) {
        const hasAddresses = (await tx.address.count({ where: { userId: user.id } })) > 0;
        await tx.address.create({
          data: {
            ...shippingAddress,
            userId: user.id,
            isDefaultShipping: !hasAddresses,
            isDefaultBilling: !hasAddresses,
          },
        });
      }

      const productById = new Map(cart.items.map((i) => [i.product.id, i.product]));
      const couponApplied = coupon && pricing.couponApplied ? coupon : null;
      const now = new Date();
      const created = await tx.order.create({
        data: {
          number: await nextOrderNumber(tx),
          userId: user.id,
          email: user.email,
          phone: shippingAddress.phone,
          paymentMethod: provider.method,
          subtotal: pricing.subtotal,
          discountTotal: pricing.discount,
          shippingTotal: pricing.shipping,
          taxTotal: pricing.tax,
          total: pricing.total,
          couponId: couponApplied ? cart.couponId : null,
          couponCode: couponApplied?.code ?? null,
          shippingMethodCode: method.code,
          shippingMethodName: method.name,
          customerNote: input.note ?? null,
          termsAcceptedAt: now,
          termsVersion: settings.legal.termsVersion,
          privacyPolicyVersion: settings.legal.privacyPolicyVersion,
          placedAt: now,
          items: {
            create: pricing.lines.map((l) => {
              const product = productById.get(l.productId)!;
              return {
                productId: l.productId,
                productName: l.name,
                productSlug: l.slug,
                imageUrl: l.image?.url ?? null,
                sku: product.sku,
                unitPrice: l.unitPrice,
                quantity: l.quantity,
              };
            }),
          },
          addresses: {
            create: (
              [
                ["SHIPPING", shippingAddress],
                ["BILLING", billingAddress],
              ] as Array<[AddressType, AddressSnapshot]>
            ).map(([type, a]) => ({ type, ...a })),
          },
          events: { create: { status: "PENDING", paymentStatus: "UNPAID" } },
        },
        select: { id: true, number: true, total: true, currency: true },
      });

      if (couponApplied && cart.couponId)
        await tx.couponUsage.create({
          data: {
            couponId: cart.couponId,
            orderId: created.id,
            userId: user.id,
            email: user.email,
            discountAmount: pricing.discount,
          },
        });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({ where: { id: cart.id }, data: { couponId: null } });
      return created;
    },
    { timeout: 20_000 },
  );

  const payment = await provider.start(order, settings.payment);
  // Emails never block or fail the order; they are only sent when a provider is configured.
  await sendOrderConfirmation(order.id, payment).catch((error) =>
    console.error("[orders] confirmation email failed", error),
  );
  return { id: order.id, number: order.number, payment };
}
