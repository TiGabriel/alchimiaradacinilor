import type { Metadata } from "next";
import Link from "next/link";

import {
  AdminPageHeader,
  AdminPagination,
  AdminSearchForm,
  AdminTable,
  adminSelect,
  td,
  th,
} from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { OrderStatusBadge } from "@/features/orders/order-detail";
import { OrderStatus } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/money";
import { listAdminOrders } from "@/services/admin/orders";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/services/orders/status";

export const metadata: Metadata = { title: "Comenzi" };

const dateTime = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requirePermission("orders:manage");
  const sp = await searchParams;
  const status = Object.values(OrderStatus).find((s) => s === one(sp.status));
  const q = one(sp.q)?.trim().slice(0, 80) || undefined;
  const { orders, total, page, pageCount } = await listAdminOrders(
    { id: user.id, roles: user.roles },
    { q, status, page: Number(one(sp.page)) || 1 },
  );
  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/admin/comenzi?${params}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Comenzi"
        description={`${total} ${total === 1 ? "comandă" : "comenzi"}`}
      />
      <AdminSearchForm
        action="/admin/comenzi"
        query={q}
        placeholder="Număr comandă, email sau nume"
      >
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Stare
          <select name="status" defaultValue={status ?? ""} className={adminSelect}>
            <option value="">Toate</option>
            {Object.entries(orderStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </AdminSearchForm>
      <AdminTable caption="Lista comenzilor">
        <thead className="border-b border-line bg-paper-deep/50">
          <tr>
            <th className={th}>Comandă</th>
            <th className={th}>Client</th>
            <th className={th}>Stare</th>
            <th className={th}>Plată</th>
            <th className={`${th} text-right`}>Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => {
            const a = o.addresses[0];
            return (
              <tr key={o.id} className="hover:bg-paper-deep/40">
                <td className={td}>
                  <Link
                    href={`/admin/comenzi/${o.id}`}
                    className="flex flex-col font-semibold hover:text-forest"
                  >
                    {o.number}
                    <span className="text-xs font-normal text-ink-muted">
                      {dateTime.format(o.placedAt)}
                    </span>
                  </Link>
                </td>
                <td className={td}>
                  <span className="flex flex-col">
                    {a ? `${a.firstName} ${a.lastName}` : o.email}
                    <span className="text-xs text-ink-muted">
                      {a?.city} · {o.email}
                    </span>
                  </span>
                </td>
                <td className={td}>
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className={td}>
                  <span className="flex flex-col text-xs">
                    {paymentMethodLabels[o.paymentMethod]}
                    <span
                      className={o.paymentStatus === "PAID" ? "text-success" : "text-ink-muted"}
                    >
                      {paymentStatusLabels[o.paymentStatus]}
                    </span>
                  </span>
                </td>
                <td className={`${td} text-right font-semibold tabular-nums`}>
                  {formatMoney(o.total)}
                </td>
              </tr>
            );
          })}
          {orders.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                Nicio comandă pentru filtrele alese.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
      <AdminPagination page={page} pageCount={pageCount} href={href} />
    </>
  );
}
