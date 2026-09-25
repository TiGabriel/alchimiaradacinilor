"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { StorageError } from "@/lib/storage";
import { AdminError } from "@/services/admin/errors";
import { saveSetting, uploadSiteImage } from "@/services/admin/settings";

import { adminAction } from "../action";

export async function saveSettingAction(key: string, value: unknown) {
  const result = await adminAction(
    "settings:manage",
    async (actor) => {
      await saveSetting(actor, z.string().max(40).parse(key), value);
      return null;
    },
    "Setările au fost salvate.",
  );
  // Settings shape the whole storefront (header, footer, prices, metadata).
  if (result.ok) revalidatePath("/", "layout");
  return result;
}

export async function uploadSiteImageAction(formData: FormData) {
  return adminAction("settings:manage", async (actor) => {
    const purpose = z.enum(["logo", "hero", "og"]).parse(formData.get("purpose"));
    const file = formData.get("file");
    if (!(file instanceof Blob) || file.size === 0) throw new AdminError("Alege o imagine.");
    try {
      return await uploadSiteImage(actor, purpose, file);
    } catch (error) {
      if (error instanceof StorageError) throw new AdminError(error.message);
      throw error;
    }
  });
}
