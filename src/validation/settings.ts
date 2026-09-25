import { z } from "zod";

/**
 * Registry of SiteSetting keys. Each key's JSON value is validated by its
 * schema; defaults keep the site usable before anything is stored.
 * Adding a setting = adding an entry here (no migration).
 */
export const settingSchemas = {
  brand: z.object({
    siteName: z.string().min(1),
    tagline: z.string(),
    /** Temporary text wordmark until a real logo image is uploaded. */
    logo: z.discriminatedUnion("kind", [
      z.object({
        kind: z.literal("wordmark"),
        primary: z.string(),
        secondary: z.string().optional(),
      }),
      z.object({
        kind: z.literal("image"),
        src: z.string().min(1),
        alt: z.string().min(1),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
      }),
    ]),
  }),
  contact: z.object({
    email: z.email(),
    phone: z.string().optional(),
    address: z.string().optional(),
    hours: z.string().optional(),
  }),
  social: z.object({
    facebookUrl: z.url().optional(),
    instagramUrl: z.url().optional(),
  }),
  shipping: z.object({
    /** Minor units (bani). */
    flatFee: z.number().int().nonnegative(),
    /** Minor units (bani); orders at or above this subtotal ship free. null disables free shipping. */
    freeShippingThreshold: z.number().int().nonnegative().nullable(),
  }),
  legal: z.object({
    /** Bump whenever the privacy policy text changes; stored with every consent record. */
    privacyPolicyVersion: z.string().min(1),
    termsVersion: z.string().min(1),
    cookiePolicyVersion: z.string().min(1),
    /** Legal entity details shown on legal pages; null until provided. */
    companyName: z.string().nullable(),
    companyRegistration: z.string().nullable(),
    companyVatNumber: z.string().nullable(),
    companyAddress: z.string().nullable(),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;

export const settingDefaults: { [K in SettingKey]: SettingValue<K> } = {
  brand: {
    siteName: "Alchimia Rădăcinilor",
    tagline: "Uleiuri esențiale și ritualuri botanice",
    logo: { kind: "wordmark", primary: "Alchimia", secondary: "Rădăcinilor" },
  },
  contact: {
    email: "salut@alchimiaradacinilor.ro",
    phone: undefined,
    address: undefined,
    hours: "Luni – Vineri, 09:00 – 17:00",
  },
  social: {
    facebookUrl: undefined,
    instagramUrl: undefined,
  },
  shipping: {
    flatFee: 1999,
    freeShippingThreshold: 25000,
  },
  legal: {
    privacyPolicyVersion: "2026-09-draft",
    termsVersion: "2026-09-draft",
    cookiePolicyVersion: "2026-09-draft",
    companyName: null,
    companyRegistration: null,
    companyVatNumber: null,
    companyAddress: null,
  },
};

export function isSettingKey(key: string): key is SettingKey {
  return Object.hasOwn(settingSchemas, key);
}

/** Parses a stored value; falls back to the default (and reports) if the stored JSON is invalid. */
export function parseSetting<K extends SettingKey>(key: K, value: unknown): SettingValue<K> {
  const result = settingSchemas[key].safeParse(value);
  if (result.success) return result.data as SettingValue<K>;
  console.warn(`[settings] Invalid value stored for "${key}", using default.`, result.error.issues);
  return settingDefaults[key];
}
