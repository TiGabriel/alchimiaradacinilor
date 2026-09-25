import { Download, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  AdminCard,
  AdminPageHeader,
  AdminSearchForm,
  AdminTable,
  adminSelect,
  StatusDot,
  td,
  th,
} from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { SubscriberStatus } from "@/generated/prisma/enums";
import { emailConfigured } from "@/lib/email";
import { listCampaigns, listSubscribers } from "@/services/admin/newsletter";

export const metadata: Metadata = { title: "Newsletter" };

const date = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});
const statusLabel = { ACTIVE: "Activ", PENDING: "Neconfirmat", UNSUBSCRIBED: "Dezabonat" } as const;
const campaignStatus = {
  DRAFT: "Ciornă",
  SENDING: "Se trimite",
  SENT: "Trimisă",
  FAILED: "Eșuată",
} as const;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function NewsletterAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { user } = await requirePermission("users:manage");
  const actor = { id: user.id, roles: user.roles };
  const sp = await searchParams;
  const status = Object.values(SubscriberStatus).find((s) => s === one(sp.status));
  const filter = {
    status,
    q: one(sp.q)?.trim().slice(0, 80) || undefined,
    source: one(sp.source)?.slice(0, 40) || undefined,
    customersOnly: one(sp.customers) === "1",
  };
  const [{ subscribers, total, statusCounts, sources }, campaigns] = await Promise.all([
    listSubscribers(actor, filter),
    listCampaigns(actor),
  ]);
  const exportParams = new URLSearchParams();
  if (status) exportParams.set("status", status);
  if (filter.q) exportParams.set("q", filter.q);
  if (filter.source) exportParams.set("source", filter.source);
  if (filter.customersOnly) exportParams.set("customers", "1");

  return (
    <>
      <AdminPageHeader
        title="Newsletter"
        description={`${statusCounts.ACTIVE ?? 0} abonați activi · ${statusCounts.PENDING ?? 0} neconfirmați · ${statusCounts.UNSUBSCRIBED ?? 0} dezabonați`}
        actions={
          <Button asChild>
            <Link href="/admin/newsletter/campanii/nou">
              <Plus aria-hidden /> Campanie nouă
            </Link>
          </Button>
        }
      />
      {!emailConfigured() ? (
        <p className="rounded-lg border border-warning/40 bg-warning-soft p-4 text-sm">
          Nu este configurat un furnizor de email: confirmările de abonare și campaniile nu pot fi
          trimise.
        </p>
      ) : null}
      <AdminCard title="Campanii">
        {campaigns.length ? (
          <ul className="flex flex-col divide-y divide-line text-sm">
            {campaigns.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                <Link
                  href={`/admin/newsletter/campanii/${c.id}`}
                  className="font-semibold hover:text-forest"
                >
                  {c.subject}
                </Link>
                <span className="text-ink-muted">
                  {campaignStatus[c.status]}
                  {c.sentAt
                    ? ` · ${date.format(c.sentAt)} · ${c.deliveredCount}/${c.recipientCount} livrate`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Nicio campanie încă.</p>
        )}
      </AdminCard>
      <AdminSearchForm action="/admin/newsletter" query={filter.q} placeholder="Email">
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Stare
          <select name="status" defaultValue={status ?? ""} className={adminSelect}>
            <option value="">Toate</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
          Sursă
          <select name="source" defaultValue={filter.source ?? ""} className={adminSelect}>
            <option value="">Toate</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input
            type="checkbox"
            name="customers"
            value="1"
            defaultChecked={filter.customersOnly}
            className="size-4 accent-forest"
          />{" "}
          Doar clienți
        </label>
      </AdminSearchForm>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {total} rezultate
          {total > subscribers.length ? ` (primele ${subscribers.length} afișate)` : ""}
        </p>
        <Button asChild variant="outline" size="sm">
          <a href={`/admin/newsletter/export?${exportParams}`}>
            <Download aria-hidden /> Exportă CSV
          </a>
        </Button>
      </div>
      <AdminTable caption="Abonați newsletter">
        <thead className="border-b border-line bg-paper-deep/50">
          <tr>
            <th className={th}>Email</th>
            <th className={th}>Stare</th>
            <th className={th}>Sursă</th>
            <th className={th}>Interese</th>
            <th className={th}>Din</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {subscribers.map((s) => (
            <tr key={s.id}>
              <td className={td}>
                {s.email}
                {s.userId ? <span className="ml-2 text-xs text-ink-muted">cont</span> : null}
              </td>
              <td className={td}>
                <StatusDot
                  tone={s.status === "ACTIVE" ? "ok" : s.status === "PENDING" ? "warn" : "off"}
                >
                  {statusLabel[s.status]}
                </StatusDot>
              </td>
              <td className={td}>{s.source ?? "—"}</td>
              <td className={`${td} text-xs`}>{s.interests.join(", ") || "—"}</td>
              <td className={`${td} text-xs`}>{date.format(s.confirmedAt ?? s.createdAt)}</td>
            </tr>
          ))}
          {subscribers.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-ink-muted">
                Niciun abonat pentru filtrele alese.
              </td>
            </tr>
          ) : null}
        </tbody>
      </AdminTable>
    </>
  );
}
