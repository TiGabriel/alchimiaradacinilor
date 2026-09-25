"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export function ErrorContent({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-page">
      <EmptyState
        size="lg"
        headingLevel="h1"
        title="Ceva nu a mers cum trebuia"
        description="A apărut o problemă neașteptată. Încearcă din nou — de cele mai multe ori este suficient."
        actions={
          <>
            <Button onClick={() => retry()}>
              <RotateCcw aria-hidden /> Încearcă din nou
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Înapoi acasă</Link>
            </Button>
          </>
        }
      />
      {error.digest ? (
        <p className="pb-12 text-center text-xs text-ink-muted">Cod eroare: {error.digest}</p>
      ) : null}
    </div>
  );
}
