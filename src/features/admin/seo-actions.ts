"use server";

import { StorageError } from "@/lib/storage";
import { AdminError } from "@/services/admin/errors";
import { uploadSeoImage } from "@/services/admin/seo";

import { adminAction } from "./action";

/** Social preview image for a product, category, routine or article (the service checks the role). */
export async function uploadSeoImageAction(formData: FormData) {
  return adminAction("admin:access", async (actor) => {
    const file = formData.get("file");
    if (!(file instanceof Blob) || file.size === 0) throw new AdminError("Alege o imagine.");
    try {
      return await uploadSeoImage(actor, file);
    } catch (error) {
      if (error instanceof StorageError) throw new AdminError(error.message);
      throw error;
    }
  });
}
