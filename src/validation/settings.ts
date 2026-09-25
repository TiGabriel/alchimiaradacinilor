import { z } from "zod";

const shippingMethodSchema = z.object({
  /** Stable identifier stored on orders. */
  code: z.string().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().min(1).max(80),
  description: z.string().max(200).optional(),
  /** Minor units (bani). */
  price: z.number().int().nonnegative(),
  /** Whether the free-shipping threshold and free-shipping coupons apply to this method. */
  freeShippingEligible: z.boolean(),
  active: z.boolean(),
});

export type ShippingMethod = z.infer<typeof shippingMethodSchema>;

/** Values stored before delivery methods existed: `{ flatFee, freeShippingThreshold }`. */
function upgradeLegacyShipping(value: unknown): unknown {
  if (value && typeof value === "object" && "flatFee" in value && !("methods" in value)) {
    const legacy = value as { flatFee: unknown; freeShippingThreshold?: unknown };
    return {
      freeShippingThreshold: legacy.freeShippingThreshold ?? null,
      methods: [
        {
          code: "curier",
          name: "Curier",
          description: "Livrare la adresa ta.",
          price: legacy.flatFee,
          freeShippingEligible: true,
          active: true,
        },
      ],
    };
  }
  return value;
}

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
  shipping: z.preprocess(
    upgradeLegacyShipping,
    z
      .object({
        /** Minor units (bani); orders at or above this subtotal (after discounts) ship free. null disables it. */
        freeShippingThreshold: z.number().int().nonnegative().nullable(),
        /** Delivery methods offered at checkout, in display order. The first active one is the cart estimate. */
        methods: z.array(shippingMethodSchema).min(1).max(10),
      })
      .refine((v) => v.methods.some((m) => m.active), "Cel puțin o metodă de livrare activă.")
      .refine(
        (v) => new Set(v.methods.map((m) => m.code)).size === v.methods.length,
        "Codurile metodelor de livrare trebuie să fie unice.",
      ),
  ),
  /**
   * Offline payment methods. Card payments need a provider integration
   * (see docs/PAYMENTS.md) and are never simulated.
   */
  payment: z.object({
    cashOnDelivery: z.object({
      enabled: z.boolean(),
      label: z.string().min(1).max(60),
      description: z.string().max(240),
    }),
    /** Offered only when enabled and the account details are filled in. */
    bankTransfer: z.object({
      enabled: z.boolean(),
      label: z.string().min(1).max(60),
      description: z.string().max(240),
      accountHolder: z.string().max(120).nullable(),
      iban: z.string().max(40).nullable(),
      bankName: z.string().max(80).nullable(),
      /** Days the order is held while waiting for the transfer. */
      paymentTermDays: z.number().int().min(1).max(30),
    }),
  }),
  /** Defaults for pages without their own SEO fields. */
  seo: z.object({
    defaultTitle: z.string().min(1).max(70),
    /** "%s" is replaced by the page title. */
    titleTemplate: z
      .string()
      .min(1)
      .max(70)
      .refine((v) => v.includes("%s"), "Folosește %s pentru titlul paginii."),
    defaultDescription: z.string().min(1).max(160),
    /** Image shared on social networks when a page has none (absolute URL or /path). */
    ogImageUrl: z.string().max(500).nullable(),
  }),
  /** Sender details for customer emails (the address itself comes from EMAIL_FROM). */
  email: z.object({
    senderName: z.string().max(80).nullable(),
    replyTo: z.email().nullable(),
  }),
  /** VAT included in catalogue prices (shown on orders). Confirm the rate with your accountant. */
  tax: z.object({
    vatRatePercent: z.number().min(0).max(100),
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
    freeShippingThreshold: 25000,
    methods: [
      {
        code: "curier",
        name: "Curier rapid",
        description: "Livrare la adresa ta, de obicei în 1–3 zile lucrătoare.",
        price: 1999,
        freeShippingEligible: true,
        active: true,
      },
    ],
  },
  payment: {
    cashOnDelivery: {
      enabled: true,
      label: "Plată la livrare",
      description: "Plătești la primirea coletului.",
    },
    bankTransfer: {
      enabled: true,
      label: "Transfer bancar",
      description: "Îți trimitem datele de plată; expediem comanda după confirmarea plății.",
      accountHolder: null,
      iban: null,
      bankName: null,
      paymentTermDays: 5,
    },
  },
  tax: {
    vatRatePercent: 21,
  },
  seo: {
    defaultTitle: "Alchimia Rădăcinilor — Uleiuri esențiale și ritualuri botanice",
    titleTemplate: "%s · Alchimia Rădăcinilor",
    defaultDescription:
      "Uleiuri esențiale, amestecuri, kit-uri și difuzoare, alese cu grijă pentru ritualurile tale de zi cu zi.",
    ogImageUrl: null,
  },
  email: {
    senderName: null,
    replyTo: null,
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
