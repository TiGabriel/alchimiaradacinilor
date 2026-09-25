import { z } from "zod";

import { CouponType } from "@/generated/prisma/enums";
import { endOfBucharestDay, startOfBucharestDay } from "@/lib/dates";
import { toMinor } from "@/lib/money";

import { optionalMoneySchema, optionalText } from "./common";

const day = z
  .union([z.iso.date("Dată invalidă."), z.literal("")])
  .optional()
  .transform((v) => v || null);

const optionalCount = z
  .union([z.string(), z.number()])
  .optional()
  .transform((v, ctx) => {
    if (v === undefined || v === "") return null;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 1 || n > 1_000_000) {
      ctx.addIssue({ code: "custom", message: "Un număr întreg, cel puțin 1." });
      return z.NEVER;
    }
    return n;
  });

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .transform((v) => v.replace(/\s+/g, "").toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9-]{3,30}$/, "3–30 caractere: litere, cifre și cratime.")),
    description: optionalText(200),
    type: z.enum(CouponType, { message: "Alege tipul reducerii." }),
    /** Percent for PERCENTAGE, lei for FIXED_AMOUNT, ignored for FREE_SHIPPING. */
    value: z.string().trim().default(""),
    minSubtotal: optionalMoneySchema,
    maxDiscount: optionalMoneySchema,
    startsOn: day,
    endsOn: day,
    usageLimit: optionalCount,
    perCustomerLimit: optionalCount,
    active: z.boolean().default(true),
    productIds: z.array(z.uuid()).max(200).default([]),
    categoryIds: z.array(z.uuid()).max(50).default([]),
  })
  .superRefine((v, ctx) => {
    if (v.type === "PERCENTAGE") {
      const n = Number(v.value.replace(",", "."));
      if (!Number.isInteger(n) || n < 1 || n > 100)
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "Procent întreg între 1 și 100.",
        });
    } else if (v.type === "FIXED_AMOUNT") {
      if (!/^\d{1,7}([.,]\d{1,2})?$/.test(v.value) || toMinor(v.value) <= 0)
        ctx.addIssue({
          code: "custom",
          path: ["value"],
          message: "Suma în lei, de ex. 25 sau 25,50.",
        });
    }
    if (v.maxDiscount != null && v.type !== "PERCENTAGE")
      ctx.addIssue({
        code: "custom",
        path: ["maxDiscount"],
        message: "Plafonul se aplică doar reducerilor procentuale.",
      });
    if (v.startsOn && v.endsOn && v.endsOn < v.startsOn)
      ctx.addIssue({
        code: "custom",
        path: ["endsOn"],
        message: "Data de final este înaintea celei de început.",
      });
    if (v.usageLimit != null && v.perCustomerLimit != null && v.perCustomerLimit > v.usageLimit)
      ctx.addIssue({
        code: "custom",
        path: ["perCustomerLimit"],
        message: "Nu poate depăși limita totală.",
      });
  })
  .transform((v) => ({
    code: v.code,
    description: v.description ?? null,
    type: v.type,
    value:
      v.type === "PERCENTAGE" ? Number(v.value) : v.type === "FIXED_AMOUNT" ? toMinor(v.value) : 0,
    minSubtotal: v.minSubtotal,
    maxDiscount: v.type === "PERCENTAGE" ? v.maxDiscount : null,
    // Validity covers whole days in the shop's time zone.
    startsAt: v.startsOn ? startOfBucharestDay(v.startsOn) : null,
    endsAt: v.endsOn ? endOfBucharestDay(v.endsOn) : null,
    usageLimit: v.usageLimit,
    perCustomerLimit: v.perCustomerLimit,
    active: v.active,
    productIds: [...new Set(v.productIds)],
    categoryIds: [...new Set(v.categoryIds)],
  }));

export type CouponFormInput = z.input<typeof couponFormSchema>;
