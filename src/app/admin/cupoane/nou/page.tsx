import type { Metadata } from "next";

import { CouponForm } from "@/features/admin/coupons/coupon-form";
import { emptyCouponForm } from "@/features/admin/coupons/defaults";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getCouponFormOptions } from "@/services/admin/coupons";

export const metadata: Metadata = { title: "Cupon nou" };

export default async function NewCouponPage() {
  const { user } = await requirePermission("orders:manage");
  const options = await getCouponFormOptions({ id: user.id, roles: user.roles });
  return (
    <>
      <AdminPageHeader title="Cupon nou" back={{ href: "/admin/cupoane", label: "Cupoane" }} />
      <CouponForm initial={emptyCouponForm()} {...options} />
    </>
  );
}
