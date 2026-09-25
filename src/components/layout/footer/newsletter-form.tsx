"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useId, useState, useTransition } from "react";
import { z } from "zod";

import { subscribeNewsletterAction } from "@/features/newsletter/actions";
import { cn } from "@/lib/utils";

const emailSchema = z.email();

/** Newsletter sign-up (double opt-in: the server emails a confirmation link). */
export function NewsletterForm({
  tone = "inverse",
  source = "footer",
}: {
  tone?: "inverse" | "ink";
  source?: "footer" | "homepage";
}) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();
    if (!emailSchema.safeParse(value).success) {
      setError("Introdu o adresă de email validă.");
      return;
    }
    setError(null);
    start(async () => {
      const result = await subscribeNewsletterAction({ email: value, source });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEmail("");
      setDone(result.message);
    });
  };

  const inverse = tone === "inverse";

  if (done)
    return (
      <p
        role="status"
        className={cn(
          "rounded-2xl px-5 py-3 text-sm",
          inverse ? "bg-ink-inverse/10 text-ink-inverse" : "bg-forest-soft/60 text-forest-deep",
        )}
      >
        {done}
      </p>
    );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2" aria-busy={pending}>
      <label htmlFor={id} className="sr-only">
        Adresa ta de email
      </label>
      <div
        className={cn(
          "flex items-center gap-1 rounded-full p-1 pl-5 ring-1 transition-shadow focus-within:ring-2",
          inverse
            ? "bg-ink-inverse/10 ring-ink-inverse/25 focus-within:ring-ink-inverse/70"
            : "bg-surface ring-line-strong focus-within:ring-forest",
        )}
      >
        <input
          id={id}
          type="email"
          autoComplete="email"
          placeholder="adresa@email.ro"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          className={cn(
            "h-10 min-w-0 flex-1 bg-transparent text-[0.9375rem] focus:outline-none",
            inverse
              ? "text-ink-inverse placeholder:text-ink-inverse/55"
              : "text-ink placeholder:text-ink-muted/70",
          )}
        />
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
            inverse
              ? "bg-paper text-forest-deep hover:bg-surface"
              : "bg-forest text-ink-inverse hover:bg-forest-deep",
          )}
        >
          {pending ? "Se trimite…" : "Abonează-te"} <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className={cn("text-sm font-medium", inverse ? "text-[#f3c9bd]" : "text-danger")}
        >
          {error}
        </p>
      ) : (
        <p
          id={`${id}-hint`}
          className={cn("text-xs", inverse ? "text-ink-inverse/65" : "text-ink-muted")}
        >
          Primești o scrisoare pe lună; confirmi abonarea din email și poți renunța oricând. Detalii
          în{" "}
          <Link href="/politica-de-confidentialitate" className="underline underline-offset-2">
            politica de confidențialitate
          </Link>
          .
        </p>
      )}
    </form>
  );
}
