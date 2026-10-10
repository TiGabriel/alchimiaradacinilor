"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { pluralRo } from "@/lib/plural";

import { AdminCard } from "../ui";

import { sendCampaignViaBrevoAction } from "./actions";

export type BrevoStats = {
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
};

/** Sending a designed campaign through Brevo, then its live statistics. */
export function BrevoSendPanel({
  campaignId,
  hasHtml,
  sent,
  problems,
  recipients,
  stats,
  statsError,
}: {
  campaignId: string;
  hasHtml: boolean;
  /** Set once the campaign went out (date already formatted for display). */
  sent: { at: string; brevoCampaignId: number | null } | null;
  problems: string[];
  recipients: number | null;
  stats: BrevoStats | null;
  statsError: string | null;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const blocked = !hasHtml || problems.length > 0 || recipients === null;

  const send = () => {
    if (blocked || sent || recipients === null) return;
    if (!confirm(`Trimiți campania către ${pluralRo(recipients, "abonat", "abonați")}?`)) return;
    start(async () => {
      const result = await sendCampaignViaBrevoAction(campaignId);
      if (!result.ok) {
        toast({ title: result.error, variant: "error" });
        router.refresh();
        return;
      }
      toast({ title: result.message ?? "Campanie trimisă.", variant: "success" });
      router.refresh();
    });
  };

  if (sent)
    return (
      <AdminCard title="Trimisă prin Brevo">
        <p className="-mt-2 text-sm text-ink-muted">
          {sent.brevoCampaignId === null
            ? `Trimisă pe ${sent.at}, fără Brevo.`
            : `Trimisă pe ${sent.at} · ID campanie Brevo: ${sent.brevoCampaignId}`}
        </p>
        {sent.brevoCampaignId === null ? null : stats ? (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Livrate", stats.delivered, stats.sent ? `din ${stats.sent} trimise` : null],
              ["Deschideri", stats.opens, percent(stats.opens, stats.delivered)],
              ["Clicuri", stats.clicks, percent(stats.clicks, stats.delivered)],
              ["Dezabonări", stats.unsubscribes, percent(stats.unsubscribes, stats.delivered)],
            ].map(([label, value, note]) => (
              <div key={label} className="rounded-lg border border-line bg-paper p-3">
                <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
                <dd className="font-display text-2xl">{value}</dd>
                {note ? <dd className="text-xs text-ink-muted">{note}</dd> : null}
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-ink-muted">
            {statsError ?? "Statisticile apar în Brevo la câteva minute după trimitere."}
          </p>
        )}
      </AdminCard>
    );

  return (
    <AdminCard
      title="Trimitere prin Brevo"
      actions={
        <Button type="button" onClick={send} loading={pending} disabled={blocked || pending}>
          <Send aria-hidden /> Trimite prin Brevo
        </Button>
      }
    >
      <p className="-mt-2 text-sm text-ink-muted">
        Brevo trimite designul de mai jos către toată lista sincronizată cu abonații confirmați
        {recipients === null ? "" : ` (${pluralRo(recipients, "abonat", "abonați")} acum)`}.
        Filtrele de destinatari din formular nu se aplică.
      </p>
      {!hasHtml ? (
        <p className="text-sm text-warning">
          Adaugă HTML-ul cu design în formular și salvează ciorna pentru a trimite prin Brevo.
        </p>
      ) : null}
      {problems.length ? (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-warning" aria-live="polite">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
    </AdminCard>
  );
}

function percent(part: number, whole: number) {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1).replace(".", ",")}%` : null;
}
