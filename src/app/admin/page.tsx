import { AlertTriangle, ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { BarList, ColumnChart } from "@/features/admin/charts";
import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { OrderStatusBadge } from "@/features/orders/order-detail";
import { formatMoney } from "@/lib/money";
import { getDashboard } from "@/services/admin/dashboard";
import { orderStatusLabels } from "@/services/orders/status";

const dayLabel = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" });
const dateTime = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

function Kpi({ label, value, change }: { label: string; value: string; change?: number | null }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="font-display text-3xl tabular-nums">{value}</span>
      {change != null ? (
        <span
          className={
            change >= 0
              ? "inline-flex items-center gap-1 text-xs font-semibold text-success"
              : "inline-flex items-center gap-1 text-xs font-semibold text-danger"
          }
        >
          {change >= 0 ? (
            <ArrowUpRight aria-hidden className="size-3.5" />
          ) : (
            <ArrowDownRight aria-hidden className="size-3.5" />
          )}
          {change >= 0 ? "+" : ""}
          {change.toString().replace(".", ",")}% față de perioada anterioară
        </span>
      ) : null}
    </div>
  );
}

export default async function AdminDashboard() {
  const { user } = await requirePermission("admin:access");
  const d = await getDashboard({ id: user.id, roles: user.roles });

  return (
    <>
      <AdminPageHeader
        title={`Bună, ${user.firstName}`}
        description={`Ultimele ${d.days} de zile, pe scurt.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {d.sales ? (
          <>
            <Kpi
              label="Vânzări"
              value={formatMoney(d.kpis.revenue)}
              change={d.kpis.revenueChange}
            />
            <Kpi label="Comenzi" value={String(d.kpis.orders)} change={d.kpis.ordersChange} />
            <Kpi label="Valoare medie comandă" value={formatMoney(d.kpis.averageOrder)} />
          </>
        ) : null}
        <Kpi label="Conturi noi" value={String(d.kpis.newCustomers)} />
        <Kpi label="Abonați newsletter" value={String(d.kpis.subscribers)} />
        <Kpi label="Recenzii de moderat" value={String(d.kpis.pendingReviews)} />
      </div>

      {d.sales ? (
        <AdminCard title="Vânzări pe zile">
          <ColumnChart
            caption={`Vânzări zilnice în ultimele ${d.days} de zile`}
            format={(v) => formatMoney(v)}
            data={d.series.map((p) => ({
              label: dayLabel.format(new Date(`${p.day}T12:00:00Z`)),
              value: p.revenue,
              tooltip: `${dayLabel.format(new Date(`${p.day}T12:00:00Z`))}: ${formatMoney(p.revenue)} (${p.orders} comenzi)`,
            }))}
          />
        </AdminCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {d.sales ? (
          <AdminCard title="Cele mai vândute produse">
            <BarList
              caption="Produse vândute (bucăți)"
              data={d.topProducts.map((p) => ({ label: p.name, value: p.quantity }))}
              format={(v) => `${v} buc.`}
            />
          </AdminCard>
        ) : null}
        <AdminCard title="De la vizită la comandă">
          <BarList
            caption="Pâlnia de conversie"
            empty="Nu există date de analiză (se colectează doar cu acordul vizitatorilor)."
            data={d.funnel.map((s) => ({
              label: s.label,
              value: s.count,
              note: s.rate != null ? `${s.rate.toString().replace(".", ",")}%` : undefined,
            }))}
          />
          <p className="text-xs text-ink-muted">
            Doar vizitatorii care au acceptat cookie-urile de analiză.
          </p>
        </AdminCard>
        {d.sales ? (
          <AdminCard
            title="Comenzi după stare"
            actions={
              <Link
                href="/admin/comenzi"
                className="text-sm font-semibold text-forest hover:underline"
              >
                Toate comenzile
              </Link>
            }
          >
            <BarList
              caption="Comenzi după stare"
              data={(Object.keys(orderStatusLabels) as Array<keyof typeof orderStatusLabels>).map(
                (s) => ({ label: orderStatusLabels[s], value: d.statusCounts[s] ?? 0 }),
              )}
            />
          </AdminCard>
        ) : null}
        <AdminCard title="Stoc redus">
          {d.lowStock.length ? (
            <ul className="flex flex-col divide-y divide-line text-sm">
              {d.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/admin/produse/${p.id}`} className="font-semibold hover:text-forest">
                    {p.name}
                  </Link>
                  <span
                    className={
                      p.stock <= 0
                        ? "inline-flex items-center gap-1 font-semibold text-danger"
                        : "font-semibold text-warning"
                    }
                  >
                    {p.stock <= 0 ? <AlertTriangle aria-hidden className="size-4" /> : null}
                    {p.stock <= 0 ? "epuizat" : `${p.stock} buc.`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Toate produsele active au stoc suficient.</p>
          )}
        </AdminCard>
      </div>

      {d.sales && d.recent.length ? (
        <AdminCard title="Comenzi recente">
          <ul className="flex flex-col divide-y divide-line text-sm">
            {d.recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <Link href={`/admin/comenzi/${o.id}`} className="font-semibold hover:text-forest">
                  {o.number}
                </Link>
                <span className="text-ink-muted">{dateTime.format(o.placedAt)}</span>
                <OrderStatusBadge status={o.status} />
                <span className="font-semibold tabular-nums">{formatMoney(o.total)}</span>
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}
    </>
  );
}
