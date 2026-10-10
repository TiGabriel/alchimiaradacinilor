import "server-only";
import { z } from "zod";

/** Optional variable where an empty value (`NAME=""`) counts as unset. */
const unsetIfEmpty = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

/**
 * Server-side environment, validated once at first access.
 * Every variable is documented in .env.example.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url(),
  APP_URL: z.url().default("http://localhost:3000"),
  /** Signs newsletter unsubscribe links and salts IP pseudonyms (sessions are random DB tokens); ≥ 32 chars. */
  AUTH_SECRET: z.string().min(32).optional(),
  EMAIL_PROVIDER: z.enum(["console", "resend", "smtp"]).default("console"),
  EMAIL_FROM: z.string().optional(),
  /** Sender for contact-form notifications (same verified domain); falls back to EMAIL_FROM. */
  EMAIL_FROM_CONTACT: unsetIfEmpty(z.string()),
  RESEND_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "s3", "netlify"]).default("local"),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),
  /** Brevo (email marketing): confirmed newsletter subscribers are mirrored to one list. */
  BREVO_API_KEY: unsetIfEmpty(z.string()),
  BREVO_LIST_ID: unsetIfEmpty(z.coerce.number().int().positive()),
  /** Shared secret Brevo sends with its webhook (unsubscribes, bounces, complaints). */
  BREVO_WEBHOOK_SECRET: unsetIfEmpty(z.string().min(24)),
  /** NETOPIA Payments (card). No default: card payments stay off until this is set explicitly. */
  NETOPIA_ENV: unsetIfEmpty(z.enum(["sandbox", "live"])),
  NETOPIA_API_KEY: unsetIfEmpty(z.string()),
  NETOPIA_POS_SIGNATURE: unsetIfEmpty(z.string()),
  /** NETOPIA public certificate/key (PEM) used to verify IPN signatures; "\n" escapes allowed. */
  NETOPIA_PUBLIC_KEY: unsetIfEmpty(z.string()),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const productionRules = serverEnvSchema.superRefine((value, ctx) => {
  if (value.NODE_ENV === "production" && !value.AUTH_SECRET) {
    ctx.addIssue({ code: "custom", path: ["AUTH_SECRET"], message: "is required in production" });
  }
});

export function parseServerEnv(source: Record<string, string | undefined>): ServerEnv {
  const result = productionRules.safeParse(source);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

export function env(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
