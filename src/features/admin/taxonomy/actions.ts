"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { deleteTaxonomy, saveTaxonomy } from "@/services/admin/taxonomy";
import { TAXONOMY_KINDS } from "@/validation/admin/taxonomy";

import { adminAction } from "../action";

const kindSchema = z.enum(TAXONOMY_KINDS);

export async function saveTaxonomyAction(kind: string, input: unknown, id?: string) {
  const k = kindSchema.parse(kind);
  const target = id ? z.uuid().parse(id) : undefined;
  const result = await adminAction(
    "catalog:edit",
    async (actor) => {
      await saveTaxonomy(actor, k, input, target);
      return null;
    },
    "Salvat.",
  );
  if (result.ok) revalidatePath(`/admin/${k}`);
  return result;
}

export async function deleteTaxonomyAction(kind: string, id: string) {
  const k = kindSchema.parse(kind);
  const result = await adminAction("catalog:edit", async (actor) => {
    await deleteTaxonomy(actor, k, z.uuid().parse(id));
    return null;
  });
  if (result.ok) revalidatePath(`/admin/${k}`);
  return result;
}
