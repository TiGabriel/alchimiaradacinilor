"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { z } from "zod";

import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const emailSchema = z.email();

/**
 * Newsletter slot. Subscriptions (double opt-in + consent records) are built in
 * a later phase; until then the form validates and explains, without storing anything.
 */
export function NewsletterForm({ tone = "inverse" }: { tone?: "inverse" | "ink" }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!emailSchema.safeParse(email.trim()).success) {
      setError("Introdu o adresă de email validă.");
      return;
    }
    setError(null);
    setEmail("");
    toast({
      title: "Mulțumim pentru interes!",
      description:
        "Abonarea la newsletter va fi disponibilă în curând. Nu am salvat încă adresa ta.",
    });
  };

  const inverse = tone === "inverse";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
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
          className={cn(
            "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-colors",
            inverse
              ? "bg-paper text-forest-deep hover:bg-surface"
              : "bg-forest text-ink-inverse hover:bg-forest-deep",
          )}
        >
          Abonează-te <ArrowRight aria-hidden className="size-4" />
        </button>
      </div>
      {error ? (
        <p
          id={`${id}-error`}
          className={cn("text-sm font-medium", inverse ? "text-[#f3c9bd]" : "text-danger")}
        >
          {error}
        </p>
      ) : (
        <p
          id={`${id}-hint`}
          className={cn("text-xs", inverse ? "text-ink-inverse/65" : "text-ink-muted")}
        >
          Poți renunța oricând. Detalii în{" "}
          <Link href="/politica-de-confidentialitate" className="underline underline-offset-2">
            politica de confidențialitate
          </Link>
          .
        </p>
      )}
    </form>
  );
}
