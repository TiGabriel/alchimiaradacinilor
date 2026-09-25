"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { deleteCoupon, saveCoupon } from "@/services/admin/coupons";

import { adminAction } from "../action";

export async function saveCouponAction(input: unknown, id?: string) {
  const target = id ? z.uuid().parse(id) : undefined;
  const result = await adminAction(
    "orders:manage",
    (actor) => saveCoupon(actor, input, target),
    "Cuponul a fost salvat.",
  );
  if (result.ok) revalidatePath("/admin/cupoane");
  return result;
}

export async function deleteCouponAction(id: string) {
  const result = await adminAction("orders:manage", async (actor) => {
    await deleteCoupon(actor, z.uuid().parse(id));
    return null;
  });
  if (result.ok) revalidatePath("/admin/cupoane");
  return result;
}
