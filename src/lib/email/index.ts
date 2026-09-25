import "server-only";

import { env, type ServerEnv } from "../env";

import { consoleProvider, resendProvider, smtpProvider } from "./providers";
import type { EmailMessage, EmailProvider, SendResult } from "./types";

export { isDelivered, type EmailMessage, type SendResult } from "./types";

type Resolution = { provider: EmailProvider; from: string } | { disabled: string };

/**
 * Picks the configured provider. The console provider is refused in
 * production, and a half-configured provider is reported as disabled —
 * sending is never faked.
 */
export function resolveEmailProvider(config: ServerEnv): Resolution {
  const from = config.EMAIL_FROM?.trim();
  switch (config.EMAIL_PROVIDER) {
    case "console":
      return config.NODE_ENV === "production"
        ? {
            disabled:
              "EMAIL_PROVIDER=console nu trimite emailuri în producție. Configurează resend sau smtp.",
          }
        : { provider: consoleProvider, from: from || "Alchimia Rădăcinilor <dev@localhost>" };
    case "resend":
      if (!config.RESEND_API_KEY) return { disabled: "RESEND_API_KEY lipsește." };
      if (!from) return { disabled: "EMAIL_FROM lipsește." };
      return { provider: resendProvider(config.RESEND_API_KEY), from };
    case "smtp":
      if (!config.SMTP_HOST) return { disabled: "SMTP_HOST lipsește." };
      if (!from) return { disabled: "EMAIL_FROM lipsește." };
      return {
        provider: smtpProvider({
          host: config.SMTP_HOST,
          port: config.SMTP_PORT ?? 587,
          user: config.SMTP_USER,
          password: config.SMTP_PASSWORD,
        }),
        from,
      };
  }
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const resolution = resolveEmailProvider(env());
  if ("disabled" in resolution) {
    console.error(
      `[email] Sending disabled: ${resolution.disabled} (to: ${message.to}, subject: ${message.subject})`,
    );
    return { status: "disabled", reason: resolution.disabled };
  }
  const result = await resolution.provider.send({ ...message, from: resolution.from });
  if (result.status === "failed")
    console.error(`[email] ${resolution.provider.name} failed:`, result.error);
  return result;
}

/** True when a real (or, in development, console) provider is set up. Optional emails check this first. */
export function emailConfigured(): boolean {
  return !("disabled" in resolveEmailProvider(env()));
}
