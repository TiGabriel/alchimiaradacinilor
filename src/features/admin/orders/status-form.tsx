"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import type { OrderStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import { orderStatusLabels } from "@/services/orders/status";

import { adminSelect } from "../ui";

import { changeOrderStatusAction, markOrderPaidAction } from "./actions";

export function OrderStatusForm({
  orderId,
  nextStatuses,
  emailEnabled,
  canMarkPaid,
}: {
  orderId: string;
  nextStatuses: OrderStatus[];
  emailEnabled: boolean;
  canMarkPaid: boolean;
}) {
  const uid = useId();
  const router = useRouter();
  const [to, setTo] = useState<OrderStatus | "">(nextStatuses[0] ?? "");
  const [note, setNote] = useState("");
  const [notify, setNotify] = useState(emailEnabled);
  const [pending, start] = useTransition();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!to) return;
    if (
      to === "CANCELLED" &&
      !confirm("Anulezi comanda? Produsele revin în stoc dacă nu au fost expediate.")
    )
      return;
    start(async () => {
      const result = await changeOrderStatusAction({
        orderId,
        to,
        note,
        notify: notify && emailEnabled,
      });
      if (!result.ok) {
        toast({ title: result.error, variant: "error" });
        return;
      }
      toast({
        title: `Stare schimbată: ${orderStatusLabels[to]}`,
        description:
          notify && emailEnabled
            ? result.data.notified
              ? "Clientul a fost anunțat pe email."
              : "Emailul către client nu a putut fi trimis."
            : undefined,
        variant: "success",
      });
      setNote("");
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {nextStatuses.length ? (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field id={`${uid}-to`} label="Stare nouă">
            {(p) => (
              <select
                {...p}
                value={to}
                onChange={(e) => setTo(e.target.value as OrderStatus)}
                className={cn(adminSelect, "h-11 w-full")}
              >
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabels[s]}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field
            id={`${uid}-note`}
            label="Notă (vizibilă clientului)"
            hint="Ex.: numărul AWB pentru livrare."
          >
            {(p) => (
              <Textarea
                {...p}
                value={note}
                maxLength={500}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-20"
              />
            )}
          </Field>
          <div className="flex flex-col gap-1">
            <Checkbox
              id={`${uid}-notify`}
              checked={notify && emailEnabled}
              disabled={!emailEnabled}
              onCheckedChange={(v) => setNotify(v === true)}
              label="Anunță clientul pe email"
            />
            {!emailEnabled ? (
              <p className="pl-8 text-xs text-ink-muted">
                Nu este configurat un furnizor de email.
              </p>
            ) : null}
          </div>
          <Button type="submit" loading={pending} className="self-start">
            Schimbă starea
          </Button>
        </form>
      ) : (
        <p className="text-sm text-ink-muted">Comanda este într-o stare finală.</p>
      )}
      {canMarkPaid ? (
        <div className="flex flex-col gap-2 border-t border-line pt-4">
          <p className="text-sm text-ink-muted">Ai primit plata (transfer sau ramburs încasat)?</p>
          <Button
            type="button"
            variant="outline"
            loading={pending}
            className="self-start"
            onClick={() =>
              start(async () => {
                const result = await markOrderPaidAction(orderId);
                toast(
                  result.ok
                    ? { title: result.message ?? "Salvat", variant: "success" }
                    : { title: result.error, variant: "error" },
                );
                router.refresh();
              })
            }
          >
            Marchează ca plătită
          </Button>
        </div>
      ) : null}
    </div>
  );
}
