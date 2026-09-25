import { describe, expect, it } from "vitest";

import { couponFormSchema, type CouponFormInput } from "./coupon";

const base: CouponFormInput = { code: " toamna 10 ", type: "PERCENTAGE", value: "10" };
const errors = (input: CouponFormInput) => {
  const r = couponFormSchema.safeParse(input);
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("couponFormSchema", () => {
  it("normalises code, value and whole-day validity", () => {
    const parsed = couponFormSchema.parse({
      ...base,
      minSubtotal: "150",
      maxDiscount: "40",
      startsOn: "2026-10-01",
      endsOn: "2026-10-31",
    });
    expect(parsed).toMatchObject({
      code: "TOAMNA10",
      value: 10,
      minSubtotal: 15000,
      maxDiscount: 4000,
    });
    expect(parsed.startsAt?.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(parsed.endsAt?.toISOString()).toBe("2026-10-31T21:59:59.999Z");
    expect(
      couponFormSchema.parse({ code: "LEI25", type: "FIXED_AMOUNT", value: "25,50" }).value,
    ).toBe(2550);
    expect(
      couponFormSchema.parse({ code: "LIVRARE", type: "FREE_SHIPPING", value: "" }).value,
    ).toBe(0);
  });

  it("rejects inconsistent coupons", () => {
    expect(errors({ ...base, value: "0" })).toHaveProperty("value");
    expect(errors({ ...base, value: "150" })).toHaveProperty("value");
    expect(errors({ ...base, value: "12.5" })).toHaveProperty("value");
    expect(errors({ code: "X25", type: "FIXED_AMOUNT", value: "abc" })).toHaveProperty("value");
    expect(
      errors({ code: "X25", type: "FIXED_AMOUNT", value: "25", maxDiscount: "10" }),
    ).toHaveProperty("maxDiscount");
    expect(errors({ ...base, startsOn: "2026-10-10", endsOn: "2026-10-01" })).toHaveProperty(
      "endsOn",
    );
    expect(errors({ ...base, usageLimit: "5", perCustomerLimit: "6" })).toHaveProperty(
      "perCustomerLimit",
    );
    expect(errors({ ...base, usageLimit: "0" })).toHaveProperty("usageLimit");
    expect(errors({ ...base, code: "a" })).toHaveProperty("code");
    expect(errors({ ...base, code: "cod!" })).toHaveProperty("code");
  });
});
