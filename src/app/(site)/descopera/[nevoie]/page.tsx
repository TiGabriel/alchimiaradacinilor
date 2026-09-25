import { ArrowRight, BookOpen, Moon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getCurrentUser } from "@/features/auth/session";
import { ProductCard } from "@/features/catalog/product-card";
import { NeedPicker } from "@/features/discover/need-picker";
import { ArticleCard } from "@/features/journal/article-card";
import { RoutineCard } from "@/features/routines/routine-card";
import { getNeedBySlug, getNeedsWithCounts } from "@/services/catalog/taxonomy";
import {
  criteriaForNeed,
  recommendArticles,
  recommendForNeed,
  recommendRoutines,
} from "@/services/recommendation";

type Props = PageProps<"/descopera/[nevoie]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const need = await getNeedBySlug((await props.params).nevoie);
  if (!need) return {};
  return {
    title: `${need.name} — ce ți se potrivește`,
    description:
      need.description ?? `Produse, rutine și articole pentru ${need.name.toLowerCase()}.`,
    alternates: { canonical: `/descopera/${need.slug}` },
  };
}

export default async function NeedPage(props: Props) {
  const { nevoie } = await props.params;
  const need = await getNeedBySlug(nevoie);
  if (!need) notFound();

  const [needs, user] = await Promise.all([getNeedsWithCounts(), getCurrentUser()]);
  const criteria = await criteriaForNeed(need);
  const [recommendations, routines, articles] = await Promise.all([
    recommendForNeed(need, { limit: 8, userId: user?.id }),
    recommendRoutines(criteria, 3),
    recommendArticles(criteria, 3),
  ]);

  return (
    <div className="container-page flex flex-col gap-14 pb-(--spacing-section)">
      <div className="pt-6 md:pt-8">
        <Breadcrumbs items={[{ label: "Descoperă", href: "/descopera" }, { label: need.name }]} />
      </div>
      <Reveal className="flex max-w-3xl flex-col gap-4">
        <p className="text-eyebrow text-clay">Ce cauți?</p>
        <h1 className="text-display-lg">{need.name}</h1>
        {need.description ? <p className="text-lg text-ink-muted">{need.description}</p> : null}
      </Reveal>
      <NeedPicker needs={needs} active={need.slug} />

      <section aria-labelledby="produse-recomandate" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="produse-recomandate" className="text-display-md">
            Produse recomandate
          </h2>
          <Button asChild variant="link">
            <Link href={`/produse?nevoie=${need.slug}`}>
              Toate produsele pentru {need.name.toLowerCase()} <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        {recommendations.length ? (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
            {recommendations.map((r, i) => (
              <li key={r.product.id}>
                <ProductCard product={r.product} reason={r.explanation} priority={i < 2} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            size="sm"
            title="Încă nu avem produse pentru această nevoie"
            description="Revino curând sau fă quiz-ul pentru alte sugestii."
          />
        )}
      </section>

      <section aria-labelledby="rutine" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="rutine" className="flex items-center gap-2 text-display-md">
            <Moon aria-hidden className="size-6 text-forest" /> Rutine
          </h2>
          <Button asChild variant="link">
            <Link href="/rutine">
              Toate rutinele <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        {routines.length ? (
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {routines.map(({ routine, explanation }) => (
              <li key={routine.id}>
                <RoutineCard routine={routine} reason={explanation} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-line bg-surface p-5 text-ink-muted">
            Încă nu avem o rutină pentru {need.name.toLowerCase()}. Descoperă{" "}
            <Link href="/rutine" className="font-semibold text-forest underline">
              celelalte rutine
            </Link>
            .
          </p>
        )}
      </section>

      <section aria-labelledby="articole" className="flex flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="articole" className="flex items-center gap-2 text-display-md">
            <BookOpen aria-hidden className="size-6 text-forest" /> Din jurnal
          </h2>
          <Button asChild variant="link">
            <Link href="/jurnal">
              Toate articolele <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        {articles.length ? (
          <ul className="grid gap-x-8 gap-y-12 md:grid-cols-3">
            {articles.map((a) => (
              <li key={a.id}>
                <ArticleCard article={a} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-line bg-surface p-5 text-ink-muted">
            Articolele despre {need.name.toLowerCase()} sunt în lucru. Până atunci,{" "}
            <Link href="/jurnal" className="font-semibold text-forest underline">
              citește jurnalul
            </Link>
            .
          </p>
        )}
      </section>

      <section className="flex flex-col items-start gap-4 rounded-2xl bg-forest p-8 text-ink-inverse md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-2xl text-ink-inverse">
            Vrei o recomandare și mai precisă?
          </p>
          <p className="text-ink-inverse/80">
            Quiz-ul ține cont și de aromele preferate, buget și ce ai deja acasă.
          </p>
        </div>
        <Button asChild variant="subtle">
          <Link href="/quiz">Începe quiz-ul</Link>
        </Button>
      </section>
    </div>
  );
}
