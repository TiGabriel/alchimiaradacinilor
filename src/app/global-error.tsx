"use client";

import { fontDisplay, fontSans } from "./fonts";

import "./globals.css";

/** Last-resort boundary (errors in the root layout). Must render its own <html>. */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="ro" className={`${fontDisplay.variable} ${fontSans.variable}`}>
      <body className="grid min-h-dvh place-items-center bg-paper p-6 text-center">
        <title>Eroare · Alchimia Rădăcinilor</title>
        <div className="flex max-w-md flex-col items-center gap-4">
          <p className="text-eyebrow text-clay">Alchimia Rădăcinilor</p>
          <h1 className="text-display-md">Site-ul are nevoie de o clipă</h1>
          <p className="text-ink-muted">
            A apărut o eroare neașteptată. Te rugăm să încerci din nou.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            className="mt-2 h-11 rounded-full bg-forest px-6 font-semibold text-ink-inverse hover:bg-forest-deep"
          >
            Încearcă din nou
          </button>
          {error.digest ? (
            <p className="text-xs text-ink-muted">Cod eroare: {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
