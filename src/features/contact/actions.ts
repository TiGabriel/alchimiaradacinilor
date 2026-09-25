"use server";

import { isDelivered, sendEmail } from "@/lib/email";
import { contactMessageEmail } from "@/lib/email/templates/account";
import { env } from "@/lib/env";
import { limiters, retryAfterText } from "@/services/auth/rate-limit";
import { getSettings } from "@/services/settings";
import { fieldErrors } from "@/validation/auth";
import { contactSchema } from "@/validation/contact";

import { formValues, type FormState } from "../auth/form-state";
import { getRequestMeta } from "../auth/session";

export async function sendContactMessageAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["name", "email", "subject", "message"]);
  const raw = Object.fromEntries(formData);
  // Bots filling the honeypot get a neutral answer and nothing is sent.
  if (typeof raw.website === "string" && raw.website.length > 0) {
    return { status: "success", message: "Mulțumim! Mesajul tău a fost trimis." };
  }

  const meta = await getRequestMeta();
  const limit = limiters.contactByIp.check(`contact:${meta.ip ?? "unknown"}`);
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Ai trimis deja câteva mesaje. Te rugăm să mai încerci peste ${retryAfterText(limit.retryAfterMs)}.`,
      values,
    };
  }

  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const { contact, brand } = await getSettings();
  const email = contactMessageEmail(parsed.data, {
    siteName: brand.siteName,
    siteUrl: env().APP_URL,
  });
  const result = await sendEmail({ to: contact.email, replyTo: parsed.data.email, ...email });

  if (!isDelivered(result)) {
    return {
      status: "error",
      message: `Momentan formularul nu poate trimite mesaje. Te rugăm să ne scrii direct la ${contact.email}.`,
      values,
    };
  }
  return {
    status: "success",
    message: "Mulțumim! Mesajul tău a fost trimis. Îți răspundem cât de repede putem.",
  };
}
