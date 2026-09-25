"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { StorageError } from "@/lib/storage";
import {
  deleteArticle,
  deleteRoutine,
  saveArticle,
  saveRoutine,
  uploadCoverImage,
} from "@/services/admin/content";
import { AdminError } from "@/services/admin/errors";

import { adminAction } from "../action";

const optionalId = (id?: string) => (id ? z.uuid().parse(id) : undefined);

export async function saveRoutineAction(input: unknown, id?: string) {
  const result = await adminAction(
    "content:edit",
    (actor) => saveRoutine(actor, input, optionalId(id)),
    "Rutina a fost salvată.",
  );
  if (result.ok) {
    revalidatePath("/admin/rutine");
    revalidatePath(`/rutine/${result.data.slug}`);
  }
  return result;
}

export async function deleteRoutineAction(id: string) {
  const result = await adminAction("content:edit", async (actor) => {
    await deleteRoutine(actor, z.uuid().parse(id));
    return null;
  });
  if (result.ok) revalidatePath("/admin/rutine");
  return result;
}

export async function saveArticleAction(input: unknown, id?: string) {
  const result = await adminAction(
    "content:edit",
    (actor) => saveArticle(actor, input, optionalId(id)),
    "Articolul a fost salvat.",
  );
  if (result.ok) {
    revalidatePath("/admin/jurnal");
    revalidatePath(`/jurnal/${result.data.slug}`);
  }
  return result;
}

export async function deleteArticleAction(id: string) {
  const result = await adminAction("content:edit", async (actor) => {
    await deleteArticle(actor, z.uuid().parse(id));
    return null;
  });
  if (result.ok) revalidatePath("/admin/jurnal");
  return result;
}

export async function uploadCoverAction(formData: FormData) {
  return adminAction("content:edit", async (actor) => {
    const folder = z.enum(["routines", "articles"]).parse(formData.get("folder"));
    const file = formData.get("file");
    if (!(file instanceof Blob) || file.size === 0) throw new AdminError("Alege o imagine.");
    try {
      return await uploadCoverImage(actor, file, folder);
    } catch (error) {
      if (error instanceof StorageError) throw new AdminError(error.message);
      throw error;
    }
  });
}
