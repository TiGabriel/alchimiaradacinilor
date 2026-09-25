import { z } from "zod";

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Completează ${label}.`)
    .max(60, `${label[0]!.toUpperCase()}${label.slice(1)} este prea lung.`)
    .regex(/^[\p{L}][\p{L}\p{M}' .-]*$/u, `Folosește doar litere pentru ${label}.`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Introdu o adresă de email validă.").max(254));

export const passwordSchema = z
  .string()
  .min(10, "Parola trebuie să aibă cel puțin 10 caractere.")
  .max(128, "Parola poate avea cel mult 128 de caractere.")
  .regex(/\p{L}/u, "Parola trebuie să conțină cel puțin o literă.")
  .regex(/\d/, "Parola trebuie să conțină cel puțin o cifră.");

const checkbox = z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean());

export const registerSchema = z
  .object({
    firstName: name("prenumele"),
    lastName: name("numele"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    privacyConsent: checkbox.refine((v) => v, {
      message:
        "Pentru a crea contul, trebuie să accepți prelucrarea datelor conform Politicii de confidențialitate.",
    }),
    // Optional and never pre-checked: anything but an explicit "on" is false.
    marketingConsent: checkbox.default(false),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Parolele nu coincid.",
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Introdu parola.").max(128),
});

export const resetRequestSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Parolele nu coincid.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Introdu parola actuală."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Parolele nu coincid.",
  })
  .refine((d) => d.password !== d.currentPassword, {
    path: ["password"],
    message: "Noua parolă trebuie să fie diferită de cea actuală.",
  });

export const profileSchema = z.object({
  firstName: name("prenumele"),
  lastName: name("numele"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .pipe(
      z.union([
        z.literal(""),
        z
          .string()
          .regex(/^(\+40|0040|0)7\d{8}$/, "Introdu un număr de telefon valid (ex. 07xx xxx xxx)."),
      ]),
    )
    .transform((v) => v || null),
});

/** Where to go after login: only same-site relative paths (no open redirects). */
export function safeNextPath(value: unknown, fallback = "/cont"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value.slice(0, 300);
}

/** Flattens Zod issues to `{ field: firstMessage }` for forms. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    out[key] ??= issue.message;
  }
  return out;
}
