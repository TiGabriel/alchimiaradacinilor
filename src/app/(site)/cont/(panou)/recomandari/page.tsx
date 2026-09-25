import { Wand2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountHeader } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { ProductCard } from "@/features/catalog/product-card";
import { hasPersonalizationConsent } from "@/services/consent/consent";
import { listUserQuizResults } from "@/services/quiz/quiz";
import { recommendFromFavourites } from "@/services/recommendation";

export const metadata: Metadata = { title: "Recomandări", robots: { index: false, follow: false } };

export default async function RecommendationsPage() {
  const { user } = await requireUser("/cont/recomandari");
  const [[latest], personalised, consent] = await Promise.all([
    listUserQuizResults(user.id, 1),
    recommendFromFavourites(user.id, 4),
    hasPersonalizationConsent(user.id),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <AccountHeader
        title="Recomandări"
        description="Produse alese pentru tine — de fiecare dată îți spunem de ce."
      />

      <section aria-labelledby="din-quiz" className="flex flex-col gap-5">
        <h2 id="din-quiz" className="font-display text-2xl">
          Din ultimul quiz
        </h2>
        {latest?.items.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3">
            {latest.items.map((item) => (
              <li key={item.product.id}>
                <ProductCard product={item.product} reason={item.reason} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            size="sm"
            className="mx-0 max-w-none rounded-xl border border-line bg-surface"
            illustration={
              <div className="grid size-full place-items-center rounded-full bg-forest-soft text-forest">
                <Wand2 aria-hidden className="size-1/3" />
              </div>
            }
            title="Încă nu avem recomandări pentru tine."
            description="Fă quiz-ul ca să descoperi de unde să începi."
            actions={
              <Button asChild size="sm">
                <Link href="/quiz">Începe quiz-ul</Link>
              </Button>
            }
          />
        )}
      </section>

      <section aria-labelledby="din-favorite" className="flex flex-col gap-5">
        <h2 id="din-favorite" className="font-display text-2xl">
          Pe baza favoritelor tale
        </h2>
        {!consent ? (
          <p className="rounded-xl border border-line bg-surface p-5 text-ink-muted">
            Poți primi sugestii bazate pe favoritele și rutinele tale dacă activezi recomandările
            personalizate din{" "}
            <Link
              href="/cont/newsletter"
              className="font-semibold text-forest underline underline-offset-2"
            >
              Preferințe
            </Link>
            .
          </p>
        ) : personalised.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {personalised.map((r) => (
              <li key={r.product.id}>
                <ProductCard product={r.product} reason={r.explanation} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-line bg-surface p-5 text-ink-muted">
            Salvează câteva produse la favorite și îți vom sugera altele care li se potrivesc.
          </p>
        )}
      </section>
    </div>
  );
}
