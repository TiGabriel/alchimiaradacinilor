import { z } from "zod";

export const COUNTIES = [
  "Alba",
  "Arad",
  "Argeș",
  "Bacău",
  "Bihor",
  "Bistrița-Năsăud",
  "Botoșani",
  "Brașov",
  "Brăila",
  "București",
  "Buzău",
  "Caraș-Severin",
  "Călărași",
  "Cluj",
  "Constanța",
  "Covasna",
  "Dâmbovița",
  "Dolj",
  "Galați",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomița",
  "Iași",
  "Ilfov",
  "Maramureș",
  "Mehedinți",
  "Mureș",
  "Neamț",
  "Olt",
  "Prahova",
  "Satu Mare",
  "Sălaj",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timiș",
  "Tulcea",
  "Vaslui",
  "Vâlcea",
  "Vrancea",
] as const;

const text = (label: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `Completează ${label}.`)
    .max(max, `${label[0]!.toUpperCase()}${label.slice(1)} este prea lung.`);

const optional = (max = 120) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

const checkbox = z.preprocess((v) => v === true || v === "on" || v === "true", z.boolean());

export const addressSchema = z.object({
  label: optional(40),
  firstName: text("prenumele", 60),
  lastName: text("numele", 60),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.-]/g, ""))
    .pipe(z.string().regex(/^(\+40|0040|0)[237]\d{8}$/, "Introdu un număr de telefon valid.")),
  street: text("strada și numărul", 160),
  streetExtra: optional(160),
  city: text("localitatea", 80),
  county: z.enum(COUNTIES, { message: "Alege județul." }),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Codul poștal are 6 cifre."),
  companyName: optional(120),
  vatNumber: z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(
      z.union([
        z.literal(""),
        z.string().regex(/^(RO)?\d{2,10}$/, "CUI invalid (ex. RO12345678)."),
      ]),
    )
    .transform((v) => v || null)
    .optional(),
  tradeRegisterNo: optional(40),
  isDefaultShipping: checkbox.default(false),
  isDefaultBilling: checkbox.default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
