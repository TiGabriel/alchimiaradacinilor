import { BookmarkCheck, RotateCcw, UserPlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrackEvent } from "@/features/analytics/track-event";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/features/auth/session";
import { ProductCard } from "@/features/catalog/product-card";
import { getAnonymousQuizId } from "@/features/quiz/anonymous";
import { PrimaryRecommendation } from "@/features/quiz/primary-recommendation";
import { getQuizResultForViewer } from "@/services/quiz/quiz";

export const metadata: Metadata = {
  title: "Descoperă ce ți se potrivește",
  robots: { index: false, follow: false },
};

export default async function QuizResultPage(props: PageProps<"/quiz/rezultat/[id]">) {
  const { id } = await props.params;
  const [user, anonymousId] = await Promise.all([getCurrentUser(), getAnonymousQuizId()]);
  const result = /^[0-9a-f-]{36}$/.test(id)
    ? await getQuizResultForViewer(id, { userId: user?.id ?? null, anonymousId })
    : null;
  if (!result) notFound();

  const [primary, ...others] = result.items;
  const here = `/quiz/rezultat/${result.id}`;

  return (
    <div className="container-page flex flex-col gap-12 pb-(--spacing-section)">
      <TrackEvent name="quiz_completed" props={{ recommendations: result.items.length }} />
      <header className="flex max-w-3xl flex-col gap-4 pt-10 md:pt-16">
        <p className="text-eyebrow text-clay">Rezultatul tău</p>
        <h1 className="text-display-lg">Descoperă ce ți se potrivește</h1>
        <p className="text-lg text-ink-muted">
          Am ales produsele în funcție de răspunsurile tale. La fiecare îți spunem de ce.
        </p>
        {result.answers.length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Răspunsurile tale">
            {result.answers.map((a) => (
              <li key={a} className="rounded-full bg-paper-deep px-3 py-1 text-sm">
                {a}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {primary ? (
        <>
          <PrimaryRecommendation product={primary.product} reason={primary.reason} />
          {others.length ? (
            <section aria-labelledby="alte-recomandari" className="flex flex-col gap-6">
              <h2 id="alte-recomandari" className="text-display-md">
                Îți mai pot plăcea
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-5">
                {others.map((item) => (
                  <li key={item.product.id}>
                    <ProductCard product={item.product} reason={item.reason} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="Nu am găsit încă o potrivire bună"
          description="Răspunsurile tale sunt foarte specifice (de exemplu bugetul sau ce ai deja acasă). Încearcă să refaci quiz-ul sau explorează după nevoie."
          actions={
            <>
              <Button asChild>
                <Link href="/quiz">Refă quiz-ul</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/descopera">Descoperă după nevoie</Link>
              </Button>
            </>
          }
        />
      )}

      <section
        aria-label="Salvează rezultatul"
        className="flex flex-col gap-4 rounded-2xl border border-line bg-paper-deep p-6 md:flex-row md:items-center md:justify-between md:p-8"
      >
        {result.saved ? (
          <p className="flex items-center gap-3 text-ink">
            <BookmarkCheck aria-hidden className="size-5 text-forest" /> Rezultatul este salvat în
            contul tău.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2 font-display text-xl">
              <UserPlus aria-hidden className="size-5 text-forest" /> Salvează rezultatul
            </p>
            <p className="text-ink-muted">
              Creează un cont gratuit și îl regăsești oricând, alături de recomandările tale.
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {result.saved ? (
            <Button asChild variant="outline">
              <Link href="/cont/quiz">Vezi în contul tău</Link>
            </Button>
          ) : (
            <>
              <Button asChild>
                <Link href={`/cont/inregistrare?next=${encodeURIComponent(here)}`}>
                  Salvează rezultatul
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href={`/cont/autentificare?next=${encodeURIComponent(here)}`}>
                  Am deja cont
                </Link>
              </Button>
            </>
          )}
          <Button asChild variant="ghost">
            <Link href="/quiz">
              <RotateCcw aria-hidden /> Refă quiz-ul
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
