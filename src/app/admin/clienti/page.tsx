import type { Metadata } from "next";
import Link from "next/link";

import {
  AdminPageHeader,
  AdminPagination,
  AdminSearchForm,
  AdminTable,
  StatusDot,
  td,
  th,
} from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { formatMoney } from "@/lib/money";
import { listCustomers } from "@/services/admin/customers";

export const metadata: Metadata = { title: "Clienți" };

const date = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requirePermission("users:manage");
  const sp = await searchParams;
  const q = one(sp.q)?.trim().slice(0, 80) || undefined;
  const { customers, total, page, pageCount } = await listCustomers(
    { id: user.id, roles: user.roles },
    { q, page: Number(one(sp.page)) || 1 },
  );
  return (
    <>
      <AdminPageHeader
        title="Clienți"
        description={`${total} ${total === 1 ? "cont" : "conturi"}`}
      />
      <AdminSearchForm action="/admin/clienti" query={q} placeholder="Nume sau email" />
      <AdminTable caption="Lista clienților">
        <thead className="border-b border-line bg-paper-deep/50">
          <tr>
            <th className={th}>Client</th>
            <th className={th}>Cont</th>
            <th className={th}>Newsletter</th>
            <th className={`${th} text-right`}>Comenzi</th>
            <th className={`${th} text-right`}>Total cheltuit</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {customers.map((c) => (
            <tr key={c.id} className="hover:bg-paper-deep/40">
              <td className={td}>
                <Link
                  href={`/admin/clienti/${c.id}`}
                  className="flex flex-col font-semibold hover:text-forest"
                >
                  {c.firstName} {c.lastName}
                  <span className="text-xs font-normal text-ink-muted">{c.email}</span>
                </Link>
              </td>
              <td className={td}>
                <span className="flex flex-col text-xs">
                  <StatusDot tone={c.emailVerifiedAt ? "ok" : "warn"}>
                    {c.emailVerifiedAt ? "Confirmat" : "Neconfirmat"}
                  </StatusDot>
                  <span className="text-ink-muted">
                    din {date.format(c.createdAt)}
                    {c.roles.some((r) => r !== "customer")
                      ? ` · ${c.roles.filter((r) => r !== "customer").join(", ")}`
                      : ""}
                  </span>
                </span>
              </td>
              <td className={td}>
                {c.subscriber?.status === "ACTIVE"
                  ? "Abonat"
                  : c.subscriber?.status === "PENDING"
                    ? "În așteptare"
                    : "—"}
              </td>
              <td className={`${td} text-right tabular-nums`}>{c._count.orders}</td>
              <td className={`${td} text-right font-semibold tabular-nums`}>
                {formatMoney(c.totalSpent)}
              </td>
            </tr>
          ))}
          {customers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                Niciun client găsit.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
      <AdminPagination
        page={page}
        pageCount={pageCount}
        href={(p) =>
          `/admin/clienti?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`
        }
      />
    </>
  );
}
