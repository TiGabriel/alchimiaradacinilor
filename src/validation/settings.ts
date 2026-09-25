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
  /** Multipliers of the recommendation engine (answer/need weights themselves live in quiz tables). */
  recommendation: z.object({
    need: z.number().min(0).max(10),
    aroma: z.number().min(0).max(10),
    tag: z.number().min(0).max(10),
    productType: z.number().min(0).max(10),
    /** Points subtracted from products above the chosen budget. */
    budgetPenalty: z.number().min(0).max(50),
    /** Weight of one selected need on /descopera/[nevoie]. */
    needSelection: z.number().min(0).max(10),
    /** Personal context (only with PERSONALIZATION consent). */
    wishlistAffinity: z.number().min(0).max(10),
    routineAffinity: z.number().min(0).max(10),
    viewedAffinity: z.number().min(0).max(10),
  }),
  /** Editorial homepage content that is not derived from the catalogue. */
  homepage: z.object({
    /** Optional hero photo (LCP). Without it the illustrated botanical composition is shown. */
    heroImage: z.object({ src: z.string().min(1), alt: z.string().min(1) }).nullable(),
    /** "Cele 5 esențiale": product slugs in display order, each with a short aroma note. */
    essentials: z.array(z.object({ slug: z.string().min(1), note: z.string().max(160) })).max(5),
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
  recommendation: {
    need: 2,
    aroma: 1.5,
    tag: 1,
    productType: 1.5,
    budgetPenalty: 12,
    needSelection: 3,
    wishlistAffinity: 1,
    routineAffinity: 1,
    viewedAffinity: 0.5,
  },
  homepage: {
    heroImage: null,
    essentials: [
      { slug: "lavender", note: "Florală și rotundă — aroma serilor liniștite." },
      { slug: "lemon", note: "Citrică și luminoasă, pentru dimineți proaspete." },
      { slug: "peppermint", note: "Mentolată și clară, pentru pauzele din mijlocul zilei." },
      { slug: "wild-orange", note: "Dulce și însorită — o aromă care încălzește casa." },
      { slug: "tea-tree", note: "Verde și ierbacee, cu o notă proaspătă, camforată." },
    ],
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
