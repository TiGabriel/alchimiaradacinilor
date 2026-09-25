import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import {
  applyCartCoupon,
  loadCartView,
  mergeGuestCartIntoUser,
  newGuestToken,
} from "@/services/cart/cart";
import { changeOrderStatus, getUserOrder, listUserOrders } from "@/services/orders/orders";
import { CheckoutError, placeOrder } from "@/services/orders/place";
import type { CheckoutInput } from "@/validation/checkout";

import { makeProduct, makeUser } from "./helpers";

const address = {
  label: null,
  firstName: "Ana",
  lastName: "Pop",
  phone: "0722123456",
  street: "Str. Florilor 1",
  streetExtra: null,
  city: "Cluj-Napoca",
  county: "Cluj" as const,
  postalCode: "400001",
  companyName: null,
  vatNumber: null,
  tradeRegisterNo: null,
  isDefaultShipping: false,
  isDefaultBilling: false,
};

async function verifiedUser(email = "ana@example.ro") {
  const user = await makeUser({ email });
  await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
  return user;
}

async function fillCart(userId: string, items: Array<{ productId: string; quantity: number }>) {
  await db.cart.upsert({
    where: { userId },
    create: { userId, items: { create: items } },
    update: { items: { deleteMany: {}, create: items } },
  });
}

async function checkout(userId: string, overrides: Partial<CheckoutInput> = {}) {
  const view = await loadCartView({ userId, token: null });
  return placeOrder(userId, {
    shipping: { kind: "new", address, save: true },
    billing: { kind: "same" },
    shippingMethod: "curier",
    paymentMethod: "CASH_ON_DELIVERY",
    note: null,
    acceptTerms: true,
    expectedTotal: view.total,
    ...overrides,
  });
}

async function checkoutError(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof CheckoutError) return error.code;
    throw error;
  }
  return "ok";
}

const stockOf = async (id: string) =>
  (await db.product.findUniqueOrThrow({ where: { id }, select: { stock: true } })).stock;

describe("placeOrder", () => {
  it("creates the order in one go: snapshots, stock, number, history, empty cart", async () => {
    const user = await verifiedUser();
    const oil = await makeProduct({ slug: "lavender", price: 5900, stock: 5 });
    const blend = await makeProduct({ slug: "blend", price: 7900, stock: 3 });
    await fillCart(user.id, [
      { productId: oil.id, quantity: 2 },
      { productId: blend.id, quantity: 1 },
    ]);

    const placed = await checkout(user.id);
    expect(placed.number).toMatch(/^AR-\d{4}-000001$/);
    expect(placed.payment.kind).toBe("offline");

    const order = await db.order.findUniqueOrThrow({
      where: { id: placed.id },
      include: { items: true, addresses: true, events: true },
    });
    expect(order).toMatchObject({
      subtotal: 19700,
      shippingTotal: 1999,
      total: 21699,
      status: "PENDING",
      paymentStatus: "UNPAID",
      paymentMethod: "CASH_ON_DELIVERY",
      shippingMethodCode: "curier",
      termsVersion: expect.any(String),
    });
    expect(order.taxTotal).toBe(Math.round((21699 * 21) / 121));
    expect(order.items.map((i) => [i.productName, i.unitPrice, i.quantity])).toEqual(
      expect.arrayContaining([
        ["Produs lavender", 5900, 2],
        ["Produs blend", 7900, 1],
      ]),
    );
    expect(order.addresses.map((a) => a.type).sort()).toEqual(["BILLING", "SHIPPING"]);
    expect(order.events).toHaveLength(1);
    expect(await stockOf(oil.id)).toBe(3);
    expect(await stockOf(blend.id)).toBe(2);
    expect((await loadCartView({ userId: user.id, token: null })).itemCount).toBe(0);
    expect(await db.address.count({ where: { userId: user.id } })).toBe(1);

    const second = await makeProduct({ price: 1000 });
    await fillCart(user.id, [{ productId: second.id, quantity: 1 }]);
    expect((await checkout(user.id)).number).toMatch(/-000002$/);
  });

  it("requires a verified email", async () => {
    const user = await makeUser();
    const p = await makeProduct();
    await fillCart(user.id, [{ productId: p.id, quantity: 1 }]);
    expect(await checkoutError(checkout(user.id))).toBe("unverified");
  });

  it("rejects a tampered or stale total and changes nothing", async () => {
    const user = await verifiedUser();
    const p = await makeProduct({ price: 5000, stock: 4 });
    await fillCart(user.id, [{ productId: p.id, quantity: 1 }]);

    expect(await checkoutError(checkout(user.id, { expectedTotal: 1 }))).toBe("price-changed");

    const view = await loadCartView({ userId: user.id, token: null });
    await db.product.update({ where: { id: p.id }, data: { price: 6000 } });
    expect(await checkoutError(checkout(user.id, { expectedTotal: view.total }))).toBe(
      "price-changed",
    );

    expect(await db.order.count()).toBe(0);
    expect(await stockOf(p.id)).toBe(4);
  });

  it("rejects quantities above stock without touching other lines", async () => {
    const user = await verifiedUser();
    const ok = await makeProduct({ stock: 10 });
    const scarce = await makeProduct({ stock: 1 });
    await fillCart(user.id, [
      { productId: ok.id, quantity: 2 },
      { productId: scarce.id, quantity: 3 },
    ]);
    expect(await checkoutError(checkout(user.id))).toBe("stock");
    expect(await stockOf(ok.id)).toBe(10);
    expect(await db.order.count()).toBe(0);
  });

  it("sells the last item once when two customers order at the same time", async () => {
    const [a, b] = [await verifiedUser("a@example.ro"), await verifiedUser("b@example.ro")];
    const other = await makeProduct({ stock: 10 });
    const last = await makeProduct({ stock: 1 });
    for (const u of [a, b])
      await fillCart(u.id, [
        { productId: other.id, quantity: 1 },
        { productId: last.id, quantity: 1 },
      ]);

    const results = await Promise.all([
      checkoutError(checkout(a.id)),
      checkoutError(checkout(b.id)),
    ]);
    expect(results.sort()).toEqual(["ok", "stock"]);
    expect(await stockOf(last.id)).toBe(0);
    // The failed order was rolled back entirely, including the other line's stock.
    expect(await stockOf(other.id)).toBe(9);
    expect(await db.order.count()).toBe(1);
    expect(await db.orderCounter.findFirst()).toMatchObject({ value: 1 });
  });

  it("creates one order on a double submit", async () => {
    const user = await verifiedUser();
    const p = await makeProduct({ stock: 5 });
    await fillCart(user.id, [{ productId: p.id, quantity: 1 }]);
    const view = await loadCartView({ userId: user.id, token: null });
    const input = {
      shipping: { kind: "new" as const, address, save: false },
      billing: { kind: "same" as const },
      shippingMethod: "curier",
      paymentMethod: "CASH_ON_DELIVERY" as const,
      acceptTerms: true as const,
      expectedTotal: view.total,
    };
    const results = await Promise.all([
      checkoutError(placeOrder(user.id, input)),
      checkoutError(placeOrder(user.id, input)),
    ]);
    expect(results.sort()).toEqual(["empty", "ok"]);
    expect(await stockOf(p.id)).toBe(4);
  });

  it("refuses someone else's saved address, unavailable delivery or payment", async () => {
    const user = await verifiedUser();
    const stranger = await verifiedUser("x@example.ro");
    const foreign = await db.address.create({ data: { ...address, userId: stranger.id } });
    const p = await makeProduct({ stock: 2 });
    await fillCart(user.id, [{ productId: p.id, quantity: 1 }]);

    expect(
      await checkoutError(
        checkout(user.id, { shipping: { kind: "saved", addressId: foreign.id } }),
      ),
    ).toBe("address");
    expect(await checkoutError(checkout(user.id, { shippingMethod: "teleport" }))).toBe("shipping");
    // Bank transfer is not offered until the account details are configured.
    expect(await checkoutError(checkout(user.id, { paymentMethod: "BANK_TRANSFER" }))).toBe(
      "payment",
    );
    expect(await checkoutError(checkout(user.id, { paymentMethod: "CARD" }))).toBe("payment");
    expect(await stockOf(p.id)).toBe(2);
  });
});

describe("coupons", () => {
  it("applies a coupon, records its use and enforces the per-customer limit", async () => {
    const user = await verifiedUser();
    const p = await makeProduct({ price: 10000, stock: 10 });
    const coupon = await db.coupon.create({
      data: { code: "PRIMAVARA", type: "PERCENTAGE", value: 10, perCustomerLimit: 1 },
    });
    await fillCart(user.id, [{ productId: p.id, quantity: 1 }]);

    const applied = await applyCartCoupon({ userId: user.id, token: null }, " primavara ");
    expect(applied.view).toMatchObject({
      discount: 1000,
      coupon: { code: "PRIMAVARA", applied: true },
    });

    const placed = await checkout(user.id);
    const order = await db.order.findUniqueOrThrow({ where: { id: placed.id } });
    expect(order).toMatchObject({
      discountTotal: 1000,
      couponCode: "PRIMAVARA",
      total: 9000 + 1999,
    });
    expect(await db.couponUsage.count({ where: { couponId: coupon.id } })).toBe(1);

    await fillCart(user.id, [{ productId: p.id, quantity: 1 }]);
    await expect(applyCartCoupon({ userId: user.id, token: null }, "PRIMAVARA")).rejects.toThrow(
      "Ai folosit deja acest cod.",
    );
    // Attached earlier (e.g. as a guest), it is still re-checked at checkout.
    await db.cart.update({ where: { userId: user.id }, data: { couponId: coupon.id } });
    const view = await loadCartView({ userId: user.id, token: null });
    expect(view.coupon).toMatchObject({ applied: false, message: "Ai folosit deja acest cod." });
    expect(await checkoutError(checkout(user.id, { expectedTotal: view.total }))).toBe("coupon");
  });

  it("limits a restricted coupon to its category (including subcategories)", async () => {
    const user = await verifiedUser();
    const parent = await db.category.create({ data: { slug: "uleiuri", name: "Uleiuri" } });
    const child = await db.category.create({
      data: { slug: "citrice", name: "Citrice", parentId: parent.id },
    });
    const lemon = await makeProduct({ price: 4000 });
    await db.product.update({ where: { id: lemon.id }, data: { categoryId: child.id } });
    const diffuser = await makeProduct({ price: 20000 });
    await db.coupon.create({
      data: {
        code: "ULEIURI",
        type: "FIXED_AMOUNT",
        value: 5000,
        categories: { create: { categoryId: parent.id } },
      },
    });
    await fillCart(user.id, [
      { productId: lemon.id, quantity: 1 },
      { productId: diffuser.id, quantity: 1 },
    ]);
    const { view } = await applyCartCoupon({ userId: user.id, token: null }, "uleiuri");
    // Capped at the eligible lines' subtotal (40 lei), not the whole cart.
    expect(view.discount).toBe(4000);
  });

  it("stops at the total usage limit and never attaches an invalid code", async () => {
    const user = await verifiedUser();
    const p = await makeProduct({ price: 5000 });
    await db.coupon.create({
      data: { code: "UNIC", type: "FIXED_AMOUNT", value: 500, usageLimit: 1 },
    });
    const other = await verifiedUser("b@example.ro");
    for (const u of [user, other]) await fillCart(u.id, [{ productId: p.id, quantity: 1 }]);

    await applyCartCoupon({ userId: user.id, token: null }, "UNIC");
    await checkout(user.id);
    await expect(applyCartCoupon({ userId: other.id, token: null }, "UNIC")).rejects.toThrow(
      "numărul maxim",
    );
    await expect(applyCartCoupon({ userId: other.id, token: null }, "NUEXISTA")).rejects.toThrow(
      "nu există",
    );
    expect((await db.cart.findUniqueOrThrow({ where: { userId: other.id } })).couponId).toBeNull();
  });

  it("carries a guest's coupon into the account cart on sign-in", async () => {
    const user = await verifiedUser();
    const p = await makeProduct({ price: 5000 });
    const coupon = await db.coupon.create({
      data: { code: "BUNVENIT", type: "FREE_SHIPPING", value: 0 },
    });
    const token = newGuestToken();
    await db.cart.create({
      data: { token, couponId: coupon.id, items: { create: { productId: p.id, quantity: 1 } } },
    });
    await mergeGuestCartIntoUser(token, user.id);
    const view = await loadCartView({ userId: user.id, token: null });
    expect(view).toMatchObject({ shipping: 0, freeShipping: true, coupon: { applied: true } });
  });
});

describe("order history and status", () => {
  it("shows orders only to their owner", async () => {
    const user = await verifiedUser();
    const stranger = await verifiedUser("x@example.ro");
    const p = await makeProduct();
    await fillCart(user.id, [{ productId: p.id, quantity: 1 }]);
    const { number } = await checkout(user.id);

    expect((await listUserOrders(user.id)).map((o) => o.number)).toEqual([number]);
    expect(await getUserOrder(user.id, number)).toMatchObject({ number, status: "PENDING" });
    expect(await getUserOrder(stranger.id, number)).toBeNull();
    expect(await getUserOrder(user.id, "../../etc")).toBeNull();
  });

  it("returns stock when an order is cancelled before shipment and keeps a history", async () => {
    const user = await verifiedUser();
    const p = await makeProduct({ stock: 3 });
    await fillCart(user.id, [{ productId: p.id, quantity: 2 }]);
    const { id } = await checkout(user.id);
    expect(await stockOf(p.id)).toBe(1);

    await changeOrderStatus({
      orderId: id,
      to: "CANCELLED",
      actorId: null,
      note: "La cererea clientului.",
    });
    expect(await stockOf(p.id)).toBe(3);
    await expect(changeOrderStatus({ orderId: id, to: "SHIPPED", actorId: null })).rejects.toThrow(
      "nu este permisă",
    );
    const events = await db.orderStatusEvent.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((e) => e.status)).toEqual(["PENDING", "CANCELLED"]);
  });
});
