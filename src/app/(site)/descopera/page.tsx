import { ArrowRight, Moon, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Sprig } from "@/components/botanical";
import { BotanicalFloat, Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { CategoryTiles } from "@/features/discover/category-cards";
import { NeedCards } from "@/features/discover/need-cards";
import { NeedPicker } from "@/features/discover/need-picker";
import { getCategoryTree } from "@/services/catalog/categories";
import { getAromasWithCounts, getNeedsWithCounts } from "@/services/catalog/taxonomy";

export const metadata: Metadata = {
  title: "Descoperă",
  description:
    "Găsește aroma potrivită: după nevoie, după profil aromatic, după categorie sau cu ajutorul quiz-ului.",
  alternates: { canonical: "/descopera" },
};

export default async function DiscoverPage() {
  const [needs, aromas, tree] = await Promise.all([
    getNeedsWithCounts(),
    getAromasWithCounts(),
    getCategoryTree(),
  ]);

  return (
    <div className="pb-(--spacing-section)">
      <section className="relative overflow-hidden">
        <BotanicalFloat className="absolute top-8 right-[6%] hidden w-36 md:block" drift={12}>
          <Sprig className="w-full text-sage/70" />
        </BotanicalFloat>
        <Reveal className="container-page flex max-w-3xl flex-col gap-4 py-14 md:py-20">
          <p className="text-eyebrow text-clay">Descoperă</p>
          <h1 className="text-display-xl">Găsește aroma care ți se potrivește</h1>
          <p className="text-lg text-ink-muted">
            Pornește de la un moment, de la o aromă preferată sau lasă-ne pe noi să te ghidăm.
          </p>
          <p className="pt-4 font-display text-2xl">Ce cauți?</p>
          <NeedPicker needs={needs} />
        </Reveal>
      </section>

      <section className="container-page grid gap-4 md:grid-cols-2">
        <Link
          href="/quiz"
          className="group relative flex flex-col gap-3 overflow-hidden rounded-xl bg-forest p-8 text-ink-inverse"
        >
          <Sparkles aria-hidden className="size-6 text-ink-inverse/80" />
          <h2 className="text-3xl text-ink-inverse">Quiz aromatic</h2>
          <p className="max-w-sm text-ink-inverse/80">
            Câteva întrebări despre preferințele tale și îți propunem aromele potrivite.
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 font-semibold">
            Începe{" "}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>
        <Link
          href="/rutine"
          className="group flex flex-col gap-3 rounded-xl border border-line bg-surface p-8"
        >
          <Moon aria-hidden className="size-6 text-forest" />
          <h2 className="text-3xl">Rutine</h2>
          <p className="max-w-sm text-ink-muted">
            Ritualuri simple, pas cu pas, pentru dimineți luminoase și seri liniștite.
          </p>
          <span className="mt-2 inline-flex items-center gap-1.5 font-semibold text-forest">
            Vezi rutinele{" "}
            <ArrowRight
              aria-hidden
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </span>
        </Link>
      </section>

      <section aria-labelledby="nevoi" className="container-page pt-(--spacing-section)">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="nevoi" className="text-display-md">
            După nevoie
          </h2>
          <Button asChild variant="link">
            <Link href="/descopera/nevoi">
              Toate nevoile <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <NeedCards needs={needs} />
      </section>

      <section aria-labelledby="arome" className="container-page pt-(--spacing-section)">
        <h2 id="arome" className="mb-8 text-display-md">
          După profil aromatic
        </h2>
        <ul className="flex flex-wrap gap-3">
          {aromas
            .filter((a) => a.productCount > 0)
            .map((aroma) => (
              <li key={aroma.slug}>
                <Link
                  href={`/produse?aroma=${aroma.slug}`}
                  className="inline-flex h-12 items-center gap-2.5 rounded-full border border-line-strong bg-surface px-5 font-semibold hover:border-forest hover:text-forest"
                >
                  <span
                    aria-hidden
                    className="size-3.5 rounded-full"
                    style={{ background: aroma.colorHex ?? "var(--color-sage)" }}
                  />
                  {aroma.name}
                  <span className="text-sm font-normal text-ink-muted">{aroma.productCount}</span>
                </Link>
              </li>
            ))}
        </ul>
      </section>

      <section aria-labelledby="categorii" className="container-page pt-(--spacing-section)">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <h2 id="categorii" className="text-display-md">
            După categorie
          </h2>
          <Button asChild variant="link">
            <Link href="/descopera/categorii">
              Toate categoriile <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
        <CategoryTiles categories={tree} />
      </section>
    </div>
  );
}
