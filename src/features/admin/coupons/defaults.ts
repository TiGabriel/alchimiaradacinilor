import { bucharestDay } from "@/lib/dates";

import type { CouponFormState } from "./coupon-form";

const lei = (v: number | null) =>
  v == null ? "" : (v / 100).toFixed(2).replace(".", ",").replace(/,00$/, "");

export const emptyCouponForm = (): CouponFormState => ({
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: "",
  minSubtotal: "",
  maxDiscount: "",
  startsOn: "",
  endsOn: "",
  usageLimit: "",
  perCustomerLimit: "",
  active: true,
  productIds: [],
  categoryIds: [],
});

export function couponToForm(c: {
  code: string;
  description: string | null;
  type: CouponFormState["type"];
  value: number;
  minSubtotal: number | null;
  maxDiscount: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  active: boolean;
  products: Array<{ productId: string }>;
  categories: Array<{ categoryId: string }>;
}): CouponFormState {
  return {
    code: c.code,
    description: c.description ?? "",
    type: c.type,
    value:
      c.type === "PERCENTAGE" ? String(c.value) : c.type === "FIXED_AMOUNT" ? lei(c.value) : "",
    minSubtotal: lei(c.minSubtotal),
    maxDiscount: lei(c.maxDiscount),
    startsOn: c.startsAt ? bucharestDay(c.startsAt) : "",
    endsOn: c.endsAt ? bucharestDay(c.endsAt) : "",
    usageLimit: c.usageLimit == null ? "" : String(c.usageLimit),
    perCustomerLimit: c.perCustomerLimit == null ? "" : String(c.perCustomerLimit),
    active: c.active,
    productIds: c.products.map((p) => p.productId),
    categoryIds: c.categories.map((x) => x.categoryId),
  };
}
