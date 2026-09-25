import { z } from "zod";

import { addressSchema } from "./address";

const id = z.uuid("Adresă invalidă.");

/** Checkout submission. Prices are never accepted from the client — only the total it displayed. */
export const checkoutSchema = z.object({
  shipping: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("saved"), addressId: id }),
    z.object({ kind: z.literal("new"), address: addressSchema, save: z.boolean().default(false) }),
  ]),
  billing: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("same") }),
    z.object({ kind: z.literal("saved"), addressId: id }),
    z.object({ kind: z.literal("new"), address: addressSchema }),
  ]),
  shippingMethod: z.string().regex(/^[a-z0-9-]{2,40}$/, "Alege o metodă de livrare."),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "BANK_TRANSFER", "CARD"], {
    message: "Alege o metodă de plată.",
  }),
  note: z
    .string()
    .trim()
    .max(500, "Nota poate avea cel mult 500 de caractere.")
    .transform((v) => v || null)
    .nullable()
    .optional(),
  acceptTerms: z.literal(true, {
    message: "Pentru a plasa comanda, acceptă termenii și politica de confidențialitate.",
  }),
  /** The total the customer saw; a different server total stops the order. */
  expectedTotal: z.number().int().nonnegative(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const quoteSchema = z.object({
  shippingMethod: z.string().regex(/^[a-z0-9-]{2,40}$/),
});

export const couponCodeSchema = z
  .string()
  .trim()
  .min(1, "Introdu un cod.")
  .max(40, "Codul este prea lung.");
