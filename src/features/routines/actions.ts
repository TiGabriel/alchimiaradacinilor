"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { toggleSavedRoutine } from "@/services/routines/routines";

import { getCurrentUser } from "../auth/session";

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
