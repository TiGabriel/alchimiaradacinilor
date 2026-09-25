import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminTable, StatusDot, td, th } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { formatMoney } from "@/lib/money";
import { listCouponsWithStats } from "@/services/admin/coupons";

export const metadata: Metadata = { title: "Cupoane" };

const date = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});

export default async function CouponsPage() {
  const { user } = await requirePermission("orders:manage");
  const coupons = await listCouponsWithStats({ id: user.id, roles: user.roles });
  const now = new Date();
  return (
    <>
      <AdminPageHeader
        title="Cupoane"
        description="Coduri de reducere, cu statistici de folosire."
        actions={
          <Button asChild>
            <Link href="/admin/cupoane/nou">
              <Plus aria-hidden /> Cupon nou
            </Link>
          </Button>
        }
      />
      <AdminTable caption="Lista cupoanelor">
        <thead className="border-b border-line bg-paper-deep/50">
          <tr>
            <th className={th}>Cod</th>
            <th className={th}>Reducere</th>
            <th className={th}>Valabilitate</th>
            <th className={`${th} text-right`}>Utilizări</th>
            <th className={`${th} text-right`}>Reducere acordată</th>
            <th className={`${th} text-right`}>Vânzări cu cod</th>
            <th className={th}>Stare</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {coupons.map((c) => {
            const expired = c.endsAt && c.endsAt < now;
            const upcoming = c.startsAt && c.startsAt > now;
            const exhausted = c.usageLimit != null && c.uses >= c.usageLimit;
            return (
              <tr key={c.id} className="hover:bg-paper-deep/40">
                <td className={td}>
                  <Link
                    href={`/admin/cupoane/${c.id}`}
                    className="flex flex-col font-mono font-semibold hover:text-forest"
                  >
                    {c.code}
                    {c.description ? (
                      <span className="font-sans text-xs font-normal text-ink-muted">
                        {c.description}
                      </span>
                    ) : null}
                  </Link>
                </td>
                <td className={td}>
                  {c.type === "PERCENTAGE"
                    ? `${c.value}%`
                    : c.type === "FIXED_AMOUNT"
                      ? formatMoney(c.value)
                      : "Livrare gratuită"}
                  {c.restricted ? (
                    <span className="block text-xs text-ink-muted">cu restricții</span>
                  ) : null}
                  {c.minSubtotal ? (
                    <span className="block text-xs text-ink-muted">
                      min. {formatMoney(c.minSubtotal)}
                    </span>
                  ) : null}
                </td>
                <td className={`${td} text-xs`}>
                  {c.startsAt ? date.format(c.startsAt) : "oricând"} –{" "}
                  {c.endsAt ? date.format(c.endsAt) : "fără sfârșit"}
                </td>
                <td className={`${td} text-right tabular-nums`}>
                  {c.uses}
                  {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(c.discountGiven)}</td>
                <td className={`${td} text-right tabular-nums`}>{formatMoney(c.revenue)}</td>
                <td className={td}>
                  <StatusDot
                    tone={!c.active || expired || exhausted ? "off" : upcoming ? "warn" : "ok"}
                  >
                    {!c.active
                      ? "Inactiv"
                      : expired
                        ? "Expirat"
                        : exhausted
                          ? "Epuizat"
                          : upcoming
                            ? "Programat"
                            : "Activ"}
                  </StatusDot>
                </td>
              </tr>
            );
          })}
          {coupons.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                Nu există cupoane încă.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </>
  );
}
