import "server-only";

import { sendEmail, type EmailMessage, type SendResult } from "@/lib/email";
import type { EmailBrand } from "@/lib/email/templates/layout";
import { env } from "@/lib/env";

import { getSettings } from "./settings";

/** Brand for templates, from settings. */
export async function emailBrand(): Promise<EmailBrand> {
  const { brand } = await getSettings();
  return { siteName: brand.siteName, siteUrl: env().APP_URL.replace(/\/$/, "") };
}

/** Sends a customer email with the sender name and reply-to configured in settings. */
export async function sendShopEmail(message: EmailMessage): Promise<SendResult> {
  const { email } = await getSettings();
  return sendEmail({
    ...message,
    fromName: message.fromName ?? email.senderName ?? undefined,
    replyTo: message.replyTo ?? email.replyTo ?? undefined,
  });
}
