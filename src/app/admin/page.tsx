import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { BarList, ColumnChart } from "@/features/admin/charts";
import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getDashboard } from "@/services/admin/dashboard";

const dayLabel = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "short" });
const dateTime = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

function Kpi({
  label,
  value,
  change,
  note,
}: {
  label: string;
  value: string;
  change?: number | null;
  note?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface p-5">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="font-display text-3xl tabular-nums">{value}</span>
      {note ? <span className="text-xs text-ink-muted">{note}</span> : null}
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
  const t = d.totals;

  return (
    <>
      <AdminPageHeader
        title={`Bună, ${user.firstName}`}
        description={`Ultimele ${d.days} de zile, pe scurt.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Conturi noi"
          value={String(d.kpis.newMembers)}
          change={d.kpis.newMembersChange}
        />
        <Kpi
          label="Abonați newsletter"
          value={String(d.kpis.subscribers)}
          note={`${d.kpis.newSubscribers} noi în această perioadă`}
        />
        <Kpi label="Recenzii de moderat" value={String(d.kpis.pendingReviews)} />
        <Kpi
          label="Clicuri spre doTERRA"
          value={String(d.outbound.clicks)}
          change={d.outbound.change}
        />
      </div>

      {d.outbound.withoutLink ? (
        <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm">
          {d.outbound.withoutLink === 1
            ? "Un produs activ nu are încă link doTERRA"
            : `${d.outbound.withoutLink} produse active nu au încă link doTERRA`}{" "}
          și afișează „Link în curând”.{" "}
          <Link
            href="/admin/produse?link=fara"
            className="font-semibold text-forest hover:underline"
          >
            Vezi lista
          </Link>
        </p>
      ) : null}

      <section aria-labelledby="totaluri" className="flex flex-col gap-3">
        <h2 id="totaluri" className="text-xs font-bold tracking-[0.12em] text-ink-muted uppercase">
          De la lansare
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.products != null ? (
            <Kpi
              label="Produse"
              value={String(t.products)}
              note={`${t.activeProducts ?? 0} active pe site`}
            />
          ) : null}
          {t.users != null ? <Kpi label="Conturi" value={String(t.users)} /> : null}
          {t.articles != null ? (
            <Kpi label="Articole publicate" value={String(t.articles)} />
          ) : null}
          {t.quizResults != null ? (
            <Kpi label="Rezultate quiz" value={String(t.quizResults)} />
          ) : null}
        </div>
      </section>

      <AdminCard title="Conturi noi pe zile">
        <ColumnChart
          caption={`Conturi create zilnic în ultimele ${d.days} de zile`}
          format={(v) => String(v)}
          data={d.signups.map((p) => ({
            label: dayLabel.format(new Date(`${p.day}T12:00:00Z`)),
            value: p.count,
            tooltip: `${dayLabel.format(new Date(`${p.day}T12:00:00Z`))}: ${p.count} conturi`,
          }))}
        />
      </AdminCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Cele mai accesate produse pe doTERRA">
          <BarList
            caption={`Clicuri pe „Cumpără de pe doTERRA” în ultimele ${d.days} de zile`}
            empty="Încă nu a fost apăsat niciun buton spre doTERRA."
            data={d.outbound.topProducts}
          />
        </AdminCard>
        <AdminCard title="De unde vin clicurile">
          <BarList
            caption="Clicuri spre doTERRA după locul butonului"
            empty="Încă nu există clicuri."
            data={d.outbound.bySource}
          />
          <p className="text-xs text-ink-muted">
            Numărate anonim, fără cookie-uri și fără date despre vizitatori.
          </p>
        </AdminCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminCard title="Activitate pe site">
          <BarList
            caption="Activitatea vizitatorilor"
            empty="Nu există date de analiză (se colectează doar cu acordul vizitatorilor)."
            data={d.activity.map((a) => ({
              label: a.label,
              value: a.count,
              note: a.rate != null ? `${a.rate.toString().replace(".", ",")}%` : undefined,
            }))}
          />
          <p className="text-xs text-ink-muted">
            Doar vizitatorii care au acceptat cookie-urile de analiză.
          </p>
        </AdminCard>
        {d.recentUsers.length ? (
          <AdminCard
            title="Conturi recente"
            actions={
              <Link
                href="/admin/clienti"
                className="text-sm font-semibold text-forest hover:underline"
              >
                Toți membrii
              </Link>
            }
          >
            <ul className="flex flex-col divide-y divide-line text-sm">
              {d.recentUsers.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <span className="flex min-w-0 flex-col">
                    <Link
                      href={`/admin/clienti/${u.id}`}
                      className="truncate font-semibold hover:text-forest"
                    >
                      {u.firstName} {u.lastName}
                    </Link>
                    <span className="truncate text-ink-muted">{u.email}</span>
                  </span>
                  <span className="text-ink-muted">{dateTime.format(u.createdAt)}</span>
                </li>
              ))}
            </ul>
          </AdminCard>
        ) : null}
      </div>
    </>
  );
}
