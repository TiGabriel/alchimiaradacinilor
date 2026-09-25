"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { OrderStatus } from "@/generated/prisma/enums";
import { adminChangeOrderStatus, adminMarkOrderPaid } from "@/services/admin/orders";

import { adminAction } from "../action";

const statusSchema = z.object({
  orderId: z.uuid(),
  to: z.enum(OrderStatus),
  note: z.string().trim().max(500).optional(),
  notify: z.boolean(),
});

export async function changeOrderStatusAction(input: unknown) {
  const result = await adminAction("orders:manage", async (actor) => {
    const data = statusSchema.parse(input);
    const { notified } = await adminChangeOrderStatus(actor, { ...data, note: data.note || null });
    return { notified };
  });
  if (result.ok) revalidatePath("/admin/comenzi");
  return result;
}

export async function markOrderPaidAction(orderId: string) {
  const result = await adminAction(
    "orders:manage",
    async (actor) => {
      await adminMarkOrderPaid(actor, z.uuid().parse(orderId));
      return null;
    },
    "Plata a fost înregistrată.",
  );
  if (result.ok) revalidatePath("/admin/comenzi");
  return result;
}
