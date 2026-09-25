import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { OrderStatusBadge } from "@/features/orders/order-detail";
import { formatMoney } from "@/lib/money";
import { getCustomer } from "@/services/admin/customers";
import { formatAddressLines } from "@/services/orders/format";

export const metadata: Metadata = { title: "Client" };

const date = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});
const purposeLabels: Record<string, string> = {
  PRIVACY_POLICY: "Politica de confidențialitate",
  NEWSLETTER: "Emailuri de marketing",
  PERSONALIZATION: "Recomandări personalizate",
  ANALYTICS: "Cookie-uri de analiză",
  MARKETING: "Cookie-uri de marketing",
  TERMS: "Termeni și condiții",
  NECESSARY: "Cookie-uri necesare",
};
const reviewStatus = {
  PENDING: "în moderare",
  APPROVED: "publicată",
  REJECTED: "respinsă",
} as const;

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { user } = await requirePermission("users:manage");
  const c = await getCustomer({ id: user.id, roles: user.roles }, id);
  if (!c) notFound();

  return (
    <>
      <AdminPageHeader
        title={`${c.firstName} ${c.lastName}`}
        description={`${c.email} · cont creat pe ${date.format(c.createdAt)}`}
        back={{ href: "/admin/clienti", label: "Clienți" }}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Comenzi", String(c.orders.length)],
          ["Total cheltuit", formatMoney(c.totalSpent)],
          ["Favorite", String(c.wishlistCount)],
          ["Rutine salvate", String(c._count.savedRoutines)],
        ].map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5"
          >
            <span className="text-sm text-ink-muted">{label}</span>
            <span className="font-display text-2xl tabular-nums">{value}</span>
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Cont">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink-muted">Email</dt>
            <dd>
              {c.emailVerifiedAt ? `confirmat pe ${date.format(c.emailVerifiedAt)}` : "neconfirmat"}
            </dd>
            <dt className="text-ink-muted">Telefon</dt>
            <dd>{c.phone ?? "—"}</dd>
            <dt className="text-ink-muted">Ultima autentificare</dt>
            <dd>{c.lastLoginAt ? date.format(c.lastLoginAt) : "—"}</dd>
            <dt className="text-ink-muted">Roluri</dt>
            <dd>{c.roles.map((r) => r.name).join(", ") || "—"}</dd>
            <dt className="text-ink-muted">Newsletter</dt>
            <dd>
              {c.subscriber
                ? `${c.subscriber.status === "ACTIVE" ? "abonat" : c.subscriber.status === "PENDING" ? "în așteptare" : "dezabonat"}${c.subscriber.source ? ` (sursă: ${c.subscriber.source})` : ""}`
                : "—"}
            </dd>
          </dl>
        </AdminCard>
        <AdminCard title="Consimțăminte (starea curentă)">
          {c.latestConsents.length ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {c.latestConsents.map((r) => (
                <li key={r.purpose} className="flex justify-between gap-3">
                  <span>{purposeLabels[r.purpose] ?? r.purpose}</span>
                  <span className={r.granted ? "text-success" : "text-ink-muted"}>
                    {r.granted ? "acordat" : "retras"} · {date.format(r.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Nu există înregistrări.</p>
          )}
        </AdminCard>
      </div>
      <AdminCard title="Comenzi">
        {c.orders.length ? (
          <ul className="flex flex-col divide-y divide-line text-sm">
            {c.orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <Link href={`/admin/comenzi/${o.id}`} className="font-semibold hover:text-forest">
                  {o.number}
                </Link>
                <span className="text-ink-muted">{date.format(o.placedAt)}</span>
                <OrderStatusBadge status={o.status} />
                <span className="font-semibold tabular-nums">{formatMoney(o.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nicio comandă.</p>
        )}
      </AdminCard>
      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Adrese">
          {c.addresses.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {c.addresses.map((a) => (
                <li key={a.id} className="text-sm leading-relaxed">
                  {a.label ? <span className="block font-semibold">{a.label}</span> : null}
                  {formatAddressLines(a).map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Nicio adresă salvată.</p>
          )}
        </AdminCard>
        <AdminCard title="Recenzii">
          {c.reviews.length ? (
            <ul className="flex flex-col gap-1.5 text-sm">
              {c.reviews.map((r) => (
                <li key={r.id} className="flex justify-between gap-3">
                  <span>
                    {r.product.name} · {r.rating}★
                  </span>
                  <span className="text-ink-muted">{reviewStatus[r.status]}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Nicio recenzie.</p>
          )}
        </AdminCard>
      </div>
    </>
  );
}
