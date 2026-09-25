"use server";

import { revalidatePath } from "next/cache";

import { AddressError, deleteAddress, saveAddress } from "@/services/account/addresses";
import { updateProfile } from "@/services/account/profile";
import { AuthError, changePassword } from "@/services/auth/accounts";
import { deleteUserSessions } from "@/services/auth/sessions";
import { setNewsletterConsent, setPersonalizationConsent } from "@/services/consent/consent";
import { addressSchema } from "@/validation/address";
import { changePasswordSchema, fieldErrors, profileSchema } from "@/validation/auth";
import { z } from "zod";

import { formValues, type FormState } from "../auth/form-state";
import { getRequestMeta, requireUser } from "../auth/session";

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user } = await requireUser("/cont/date-personale");
  const values = formValues(formData, ["firstName", "lastName", "phone"]);
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };
  await updateProfile(user.id, parsed.data);
  revalidatePath("/cont", "layout");
  return { status: "success", message: "Datele au fost salvate.", values };
}

const ADDRESS_FIELDS = [
  "label",
  "firstName",
  "lastName",
  "phone",
  "street",
  "streetExtra",
  "city",
  "county",
  "postalCode",
  "companyName",
  "vatNumber",
  "tradeRegisterNo",
];

export async function saveAddressAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user } = await requireUser("/cont/adrese");
  const values = formValues(formData, ADDRESS_FIELDS);
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };
  const id = z.uuid().safeParse(formData.get("id"));
  try {
    await saveAddress(user.id, parsed.data, id.success ? id.data : undefined);
  } catch (error) {
    if (error instanceof AddressError) return { status: "error", message: error.message, values };
    throw error;
  }
  revalidatePath("/cont/adrese");
  return {
    status: "success",
    message: id.success ? "Adresa a fost actualizată." : "Adresa a fost adăugată.",
  };
}

export async function deleteAddressAction(addressId: string): Promise<FormState> {
  const { user } = await requireUser("/cont/adrese");
  const id = z.uuid().safeParse(addressId);
  if (!id.success) return { status: "error", message: "Adresa nu a fost găsită." };
  try {
    await deleteAddress(user.id, id.data);
  } catch (error) {
    if (error instanceof AddressError) return { status: "error", message: error.message };
    throw error;
  }
  revalidatePath("/cont/adrese");
  return { status: "success", message: "Adresa a fost ștearsă." };
}

export async function changePasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await requireUser("/cont/securitate");
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };
  try {
    await changePassword(
      session.user.id,
      parsed.data.currentPassword,
      parsed.data.password,
      session.sessionId,
    );
  } catch (error) {
    if (error instanceof AuthError)
      return { status: "error", errors: { currentPassword: error.message } };
    throw error;
  }
  revalidatePath("/cont/securitate");
  return {
    status: "success",
    message: "Parola a fost schimbată. Celelalte dispozitive au fost deconectate.",
  };
}

export async function signOutOtherDevicesAction(): Promise<FormState> {
  const session = await requireUser("/cont/securitate");
  await deleteUserSessions(session.user.id, session.sessionId);
  revalidatePath("/cont/securitate");
  return { status: "success", message: "Te-ai deconectat de pe celelalte dispozitive." };
}

export async function setNewsletterAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user } = await requireUser("/cont/newsletter");
  const granted = formData.get("subscribe") === "1";
  const meta = await getRequestMeta();
  await setNewsletterConsent(user.id, granted, {
    source: "cont/newsletter",
    ipHash: meta.ipHash,
    userAgent: meta.userAgent,
  });
  revalidatePath("/cont", "layout");
  return {
    status: "success",
    message: granted
      ? "Te-ai abonat la newsletter. Mulțumim!"
      : "Consimțământul pentru emailuri de marketing a fost retras. Nu vei mai primi newslettere.",
  };
}

export async function setPersonalizationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { user } = await requireUser("/cont/newsletter");
  const granted = formData.get("personalize") === "1";
  const meta = await getRequestMeta();
  await setPersonalizationConsent(user.id, granted, {
    source: "cont/preferinte",
    ipHash: meta.ipHash,
    userAgent: meta.userAgent,
  });
  revalidatePath("/cont", "layout");
  return {
    status: "success",
    message: granted
      ? "Vom folosi favoritele și rutinele tale pentru recomandări mai potrivite."
      : "Recomandările nu vor mai folosi activitatea ta din cont.",
  };
}
