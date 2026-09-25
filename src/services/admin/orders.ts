import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

import { assertCan, type Actor } from "../auth/permissions";
import { changeOrderStatus, markOrderPaid, OrderStatusError } from "../orders/orders";
import { allowedTransitions } from "../orders/status";

import { AdminError } from "./errors";

const PAGE_SIZE = 25;

export async function listAdminOrders(
  actor: Actor,
  filter: { q?: string; status?: OrderStatus; page?: number },
) {
  assertCan(actor, "orders:manage");
  const where: Prisma.OrderWhereInput = {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.q
      ? {
          OR: [
            { number: { contains: filter.q, mode: "insensitive" } },
            { email: { contains: filter.q, mode: "insensitive" } },
            { addresses: { some: { lastName: { contains: filter.q, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
  const page = Math.max(1, filter.page ?? 1);
  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        number: true,
        email: true,
        placedAt: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        addresses: {
          where: { type: "SHIPPING" },
          select: { firstName: true, lastName: true, city: true },
        },
        _count: { select: { items: true } },
      },
    }),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), orders };
}

export async function getAdminOrder(actor: Actor, id: string) {
  assertCan(actor, "orders:manage");
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: { orderBy: { id: "asc" } },
      addresses: true,
      events: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { firstName: true, lastName: true } } },
      },
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  if (!order) return null;
  return {
    ...order,
    shippingAddress: order.addresses.find((a) => a.type === "SHIPPING") ?? null,
    billingAddress: order.addresses.find((a) => a.type === "BILLING") ?? null,
    nextStatuses: allowedTransitions(order.status),
  };
}

export async function adminChangeOrderStatus(
  actor: Actor,
  input: { orderId: string; to: OrderStatus; note?: string | null; notify: boolean },
) {
  assertCan(actor, "orders:manage");
  try {
    return await changeOrderStatus({ ...input, actorId: actor.id });
  } catch (error) {
    if (error instanceof OrderStatusError) throw new AdminError(error.message);
    throw error;
  }
}

export async function adminMarkOrderPaid(actor: Actor, orderId: string) {
  assertCan(actor, "orders:manage");
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { paymentStatus: true, status: true },
  });
  if (!order) throw new AdminError("Comanda nu există.");
  if (order.paymentStatus === "PAID") throw new AdminError("Plata este deja înregistrată.");
  if (order.status === "CANCELLED") throw new AdminError("Comanda este anulată.");
  return markOrderPaid(orderId, actor.id);
}
