"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { StorageError } from "@/lib/storage";
import { AdminError } from "@/services/admin/errors";
import {
  addProductImage,
  deleteProduct,
  removeProductImage,
  reorderProductImages,
  saveProduct,
  setProductThumbnail,
  updateProductImageAlt,
} from "@/services/admin/products";

import { adminAction } from "../action";

const id = z.uuid();

export async function saveProductAction(input: unknown, productId?: string) {
  const target = productId ? id.parse(productId) : undefined;
  const result = await adminAction(
    "catalog:edit",
    (actor) => saveProduct(actor, input, target),
    target ? "Produsul a fost salvat." : "Produsul a fost creat.",
  );
  if (result.ok) {
    revalidatePath("/admin/produse");
    revalidatePath(`/produs/${result.data.slug}`);
  }
  return result;
}

export async function deleteProductAction(productId: string) {
  const result = await adminAction("catalog:edit", (actor) =>
    deleteProduct(actor, id.parse(productId)),
  );
  if (result.ok) revalidatePath("/admin/produse");
  return result;
}

export async function uploadProductImageAction(formData: FormData) {
  return adminAction("catalog:edit", async (actor) => {
    const productId = id.parse(formData.get("productId"));
    const file = formData.get("file");
    if (!(file instanceof Blob) || file.size === 0) throw new AdminError("Alege o imagine.");
    try {
      await addProductImage(actor, productId, file, String(formData.get("alt") ?? ""));
    } catch (error) {
      if (error instanceof StorageError) throw new AdminError(error.message);
      throw error;
    }
    revalidatePath(`/admin/produse/${productId}`);
    return null;
  });
}

export async function reorderProductImagesAction(productId: string, orderedIds: string[]) {
  return adminAction("catalog:edit", async (actor) => {
    await reorderProductImages(actor, id.parse(productId), z.array(id).max(12).parse(orderedIds));
    revalidatePath(`/admin/produse/${productId}`);
    return null;
  });
}

export async function setProductThumbnailAction(productId: string, imageId: string) {
  return adminAction("catalog:edit", async (actor) => {
    await setProductThumbnail(actor, id.parse(productId), id.parse(imageId));
    revalidatePath(`/admin/produse/${productId}`);
    return null;
  });
}

export async function updateProductImageAltAction(productId: string, imageId: string, alt: string) {
  return adminAction("catalog:edit", async (actor) => {
    await updateProductImageAlt(actor, id.parse(productId), id.parse(imageId), String(alt));
    return null;
  });
}

export async function removeProductImageAction(productId: string, imageId: string) {
  return adminAction("catalog:edit", async (actor) => {
    await removeProductImage(actor, id.parse(productId), id.parse(imageId));
    revalidatePath(`/admin/produse/${productId}`);
    return null;
  });
}
