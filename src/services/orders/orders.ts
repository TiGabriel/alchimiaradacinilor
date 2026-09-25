import "server-only";

import type { OrderStatus, PaymentStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { getSetting } from "@/services/settings";

import { providerFor } from "../payments/methods";

import { sendOrderStatusEmail } from "./notifications";
import { canTransition, ORDER_NUMBER_PATTERN, restocksOn } from "./status";

export type OrderListItem = {
  id: string;
  number: string;
  placedAt: Date;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  total: number;
  currency: string;
  itemCount: number;
  previews: Array<{ name: string; imageUrl: string | null }>;
};

export async function listUserOrders(userId: string): Promise<OrderListItem[]> {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { placedAt: "desc" },
    select: {
      id: true,
      number: true,
      placedAt: true,
      status: true,
      paymentStatus: true,
      total: true,
      currency: true,
      items: { select: { productName: true, imageUrl: true, quantity: true } },
    },
  });
  return orders.map(({ items, ...o }) => ({
    ...o,
    itemCount: items.reduce((n, i) => n + i.quantity, 0),
    previews: items.slice(0, 3).map((i) => ({ name: i.productName, imageUrl: i.imageUrl })),
  }));
}

/** An order as its owner sees it; null for someone else's order or a malformed number. */
export async function getUserOrder(userId: string, number: string) {
  if (!ORDER_NUMBER_PATTERN.test(number)) return null;
  const order = await db.order.findFirst({
    where: { number, userId },
    include: {
      items: { orderBy: { id: "asc" } },
      addresses: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) return null;

  // Payment instructions stay available until the order is paid or closed.
  let paymentInstructions: string[] = [];
  const provider = providerFor(order.paymentMethod);
  if (
    provider &&
    order.paymentStatus === "UNPAID" &&
    !["CANCELLED", "REFUNDED"].includes(order.status)
  ) {
    const start = await provider.start(order, await getSetting("payment"));
    if (start.kind === "offline") paymentInstructions = start.instructions;
  }
  return {
    ...order,
    shippingAddress: order.addresses.find((a) => a.type === "SHIPPING") ?? null,
    billingAddress: order.addresses.find((a) => a.type === "BILLING") ?? null,
    paymentInstructions,
  };
}

export type UserOrder = NonNullable<Awaited<ReturnType<typeof getUserOrder>>>;

export class OrderStatusError extends Error {}

/**
 * Moves an order to a new status (admin, Phase 11): validates the transition,
 * returns stock when cancelling before shipment, appends a history event and,
 * when asked and a provider is configured, emails the customer.
 */
export async function changeOrderStatus(input: {
  orderId: string;
  to: OrderStatus;
  actorId: string | null;
  note?: string | null;
  notify?: boolean;
}) {
  const event = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${input.orderId} FOR UPDATE`;
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      select: { status: true, paymentStatus: true, items: true },
    });
    if (!order) throw new OrderStatusError("Comanda nu există.");
    if (!canTransition(order.status, input.to))
      throw new OrderStatusError("Tranziția de status nu este permisă.");

    if (restocksOn(order.status, input.to))
      for (const item of order.items)
        if (item.productId)
          await tx.product.updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });

    const now = new Date();
    await tx.order.update({
      where: { id: input.orderId },
      data: {
        status: input.to,
        ...(input.to === "SHIPPED" ? { shippedAt: now } : {}),
        ...(input.to === "CANCELLED" ? { cancelledAt: now } : {}),
      },
    });
    return tx.orderStatusEvent.create({
      data: {
        orderId: input.orderId,
        status: input.to,
        paymentStatus: order.paymentStatus,
        note: input.note?.trim() || null,
        actorId: input.actorId,
      },
    });
  });
  const notified = input.notify ? await sendOrderStatusEmail(event.id).catch(() => false) : false;
  return { event, notified };
}

/** Records a confirmed payment (bank transfer received, or a provider webhook). */
export async function markOrderPaid(orderId: string, actorId: string | null) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId },
      data: { paymentStatus: "PAID", paidAt: new Date() },
      select: { status: true },
    });
    return tx.orderStatusEvent.create({
      data: { orderId, status: order.status, paymentStatus: "PAID", actorId },
    });
  });
}
