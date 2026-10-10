"use client";

import { CreditCard } from "lucide-react";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { retryCardPaymentAction } from "./actions";

/** "Pay by card" for an unpaid card order; the server opens a new NETOPIA attempt and redirects. */
export function RetryCardPayment({ number }: { number: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        className="self-start"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await retryCardPaymentAction(number);
            if (result?.error) setError(result.error);
          })
        }
      >
        <CreditCard aria-hidden /> {pending ? "Te redirecționăm…" : "Plătește cu cardul"}
      </Button>
      <p role="status" aria-live="polite" className="text-sm text-clay">
        {error}
      </p>
    </div>
  );
}
