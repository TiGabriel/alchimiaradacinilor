"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { CartView } from "@/services/cart/cart";
import { addRoutineToCart } from "@/services/cart/routine";
import { describeRoutinePlan } from "@/services/routines/routine-cart";
import { toggleSavedRoutine } from "@/services/routines/routines";

import { getCurrentUser } from "../auth/session";
import { getCartOwner, setGuestCartCookie } from "../cart/owner";

export type RoutineCartResult =
  { ok: true; cart: CartView; added: number; message: string } | { ok: false; error: string };

export async function addRoutineToCartAction(routineId: string): Promise<RoutineCartResult> {
  const id = z.uuid().safeParse(routineId);
  if (!id.success) return { ok: false, error: "Rutina nu a fost găsită." };
  try {
    const result = await addRoutineToCart(await getCartOwner(), id.data);
    if (result.token) await setGuestCartCookie(result.token);
    return {
      ok: true,
      cart: result.view,
      added: result.added.length,
      message: describeRoutinePlan(result.added, result.skipped),
    };
  } catch (error) {
    console.error("[routine-cart]", error);
    return { ok: false, error: "Nu am putut adăuga produsele. Te rugăm să încerci din nou." };
  }
}

export type SaveRoutineResult =
  { ok: true; saved: boolean } | { ok: false; reason: "signed-out" | "error" };

export async function toggleSaveRoutineAction(routineId: string): Promise<SaveRoutineResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "signed-out" };
  const id = z.uuid().safeParse(routineId);
  if (!id.success) return { ok: false, reason: "error" };
  const saved = await toggleSavedRoutine(user.id, id.data);
  revalidatePath("/cont/rutine");
  return { ok: true, saved };
}
