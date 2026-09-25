"use server";

import { revalidatePath } from "next/cache";

import { StorageError } from "@/lib/storage";
import { ReviewError, submitReview } from "@/services/reviews/reviews";
import { reviewSchema } from "@/validation/review";

import { formValues, type FormState } from "../auth/form-state";
import { requireUser } from "../auth/session";

export async function submitReviewAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["productId", "rating", "title", "body"]);
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) errors[String(issue.path[0])] ??= issue.message;
    return { status: "error", message: "Verifică câmpurile marcate.", errors, values };
  }
  const { user } = await requireUser();
  const image = formData.get("image");
  try {
    await submitReview(user.id, parsed.data, image instanceof Blob ? image : null);
  } catch (error) {
    if (error instanceof ReviewError || error instanceof StorageError)
      return {
        status: "error",
        message: error.message,
        errors: error instanceof StorageError ? { image: error.message } : undefined,
        values,
      };
    console.error("[reviews]", error);
    return { status: "error", message: "Nu am putut trimite recenzia. Încearcă din nou.", values };
  }
  const slug = formData.get("productSlug");
  if (typeof slug === "string" && /^[a-z0-9-]+$/.test(slug)) revalidatePath(`/produs/${slug}`);
  return {
    status: "success",
    message: "Mulțumim! Recenzia ta a fost trimisă și va apărea după verificare.",
  };
}
