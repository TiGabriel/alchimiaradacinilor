"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { StatusDot } from "../ui";

import { checkProductLinkAction } from "./actions";

const checkedAt = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

const statusLabel = {
  UNCHECKED: { tone: "off", text: "Netestat" },
  OK: { tone: "ok", text: "Funcționează" },
  BROKEN: { tone: "danger", text: "Nefuncțional" },
} as const;

/** Status of the saved doTERRA link, with "Testează linkul" (a server-side request). */
export function LinkCheck({
  productId,
  referralUrl,
  status,
  lastChecked,
}: {
  productId: string;
  referralUrl: string | null;
  status: keyof typeof statusLabel;
  /** ISO date of the last conclusive test. */
  lastChecked: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!referralUrl)
    return (
      <p className="text-sm text-ink-muted">
        Produsul nu are încă link doTERRA, așa că pe site apare „Link în curând”. Lipește linkul de
        recomandare în câmpul de mai jos și salvează.
      </p>
    );

  const label = statusLabel[status];
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <StatusDot tone={label.tone}>{label.text}</StatusDot>
        <span className="text-ink-muted">
          {lastChecked
            ? `Testat pe ${checkedAt.format(new Date(lastChecked))}`
            : "Nu a fost testat încă"}
        </span>
      </div>
      <p className="truncate font-mono text-xs text-ink-muted" title={referralUrl}>
        {referralUrl}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          loading={pending}
          onClick={() =>
            start(async () => {
              const result = await checkProductLinkAction(productId);
              setMessage(result.ok ? result.data.message : result.error);
            })
          }
        >
          <Link2 aria-hidden /> Testează linkul
        </Button>
        <Button asChild size="sm" variant="ghost">
          <a href={referralUrl} target="_blank" rel="noopener noreferrer">
            Deschide linkul <ExternalLink aria-hidden />
          </a>
        </Button>
      </div>
      <p aria-live="polite" className="text-ink-muted">
        {message}
      </p>
    </div>
  );
}
