"use client";

import { CheckCircle2, MailX } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { confirmNewsletterAction, unsubscribeNewsletterAction } from "./actions";

/**
 * A button instead of acting on page load: email security scanners open links
 * automatically, and must not confirm or cancel subscriptions on their own.
 */
export function ConfirmSubscription({ token }: { token: string }) {
  const [result, setResult] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (result === "confirmed" || result === "already-active")
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center">
        <CheckCircle2 aria-hidden className="size-10 text-forest" />
        <p className="font-display text-2xl">
          {result === "confirmed"
            ? "Abonarea este confirmată. Bine ai venit!"
            : "Ești deja abonat."}
        </p>
        <p className="text-ink-muted">Prima scrisoare botanică ajunge la tine luna aceasta.</p>
        <Button asChild variant="outline">
          <Link href="/jurnal">Citește jurnalul</Link>
        </Button>
      </div>
    );
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {result === "invalid" ? (
        <p role="alert" className="text-danger">
          Linkul nu mai este valid (a expirat sau a fost deja folosit). Te poți abona din nou din
          subsolul paginii.
        </p>
      ) : (
        <p className="text-ink-muted">Un singur pas: confirmă că vrei să primești newsletterul.</p>
      )}
      <Button
        size="lg"
        loading={pending}
        disabled={result === "invalid"}
        onClick={() => start(async () => setResult(await confirmNewsletterAction(token)))}
      >
        Confirmă abonarea
      </Button>
    </div>
  );
}

export function ConfirmUnsubscribe({
  subscriberId,
  signature,
}: {
  subscriberId: string;
  signature: string;
}) {
  const [result, setResult] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (result === "unsubscribed" || result === "already")
    return (
      <div role="status" className="flex flex-col items-center gap-4 text-center">
        <MailX aria-hidden className="size-10 text-forest" />
        <p className="font-display text-2xl">Te-ai dezabonat.</p>
        <p className="text-ink-muted">
          Nu vei mai primi newsletterul. Emailurile despre comenzi continuă să ajungă la tine.
        </p>
      </div>
    );
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      {result === "invalid" ? (
        <p role="alert" className="text-danger">
          Linkul de dezabonare nu este valid. Ne poți scrie și te dezabonăm noi.
        </p>
      ) : (
        <p className="text-ink-muted">
          Nu vei mai primi newsletterul nostru. Ne pare rău să te vedem plecând.
        </p>
      )}
      <Button
        size="lg"
        loading={pending}
        disabled={result === "invalid"}
        onClick={() =>
          start(async () => setResult(await unsubscribeNewsletterAction(subscriberId, signature)))
        }
      >
        Confirmă dezabonarea
      </Button>
    </div>
  );
}
