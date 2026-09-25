import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { deleteCouponAction } from "@/features/admin/coupons/actions";
import { CouponForm } from "@/features/admin/coupons/coupon-form";
import { couponToForm } from "@/features/admin/coupons/defaults";
import { DeleteButton } from "@/features/admin/delete-button";
import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getCoupon, getCouponFormOptions } from "@/services/admin/coupons";

export const metadata: Metadata = { title: "Cupon" };

export default async function CouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { user } = await requirePermission("orders:manage");
  const actor = { id: user.id, roles: user.roles };
  const [coupon, options] = await Promise.all([getCoupon(actor, id), getCouponFormOptions(actor)]);
  if (!coupon) notFound();
  return (
    <>
      <AdminPageHeader
        title={coupon.code}
        description={`Folosit în ${coupon._count.usages} ${coupon._count.usages === 1 ? "comandă" : "comenzi"}.`}
        back={{ href: "/admin/cupoane", label: "Cupoane" }}
      />
      <CouponForm couponId={coupon.id} initial={couponToForm(coupon)} {...options} />
      <AdminCard title="Zonă periculoasă" className="border-danger/30">
        <p className="text-sm text-ink-muted">
          {coupon._count.usages
            ? "Codul a fost folosit, deci rămâne în istoric. Debifează „Activ” ca să nu mai poată fi folosit."
            : "Ștergerea este definitivă."}
        </p>
        {coupon._count.usages === 0 ? (
          <div>
            <DeleteButton
              action={deleteCouponAction.bind(null, coupon.id)}
              confirmText={`Ștergi codul ${coupon.code}?`}
              redirectTo="/admin/cupoane"
              label="Șterge cuponul"
            />
          </div>
        ) : null}
      </AdminCard>
    </>
  );
}
