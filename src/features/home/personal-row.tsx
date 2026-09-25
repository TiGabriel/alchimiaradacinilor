import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/catalog/product-card";
import type { ProductCardData } from "@/services/catalog/product-types";
import type { PersonalRow } from "@/services/home/select";

/** "Recomandat pentru tine" — signed-in customers only; explains where picks come from. */
export function PersonalRowSection({
  firstName,
  row,
}: {
  firstName: string;
  row: PersonalRow<ProductCardData> | null;
}) {
  return (
    <section aria-labelledby="pentru-tine" className="py-(--spacing-section)">
      <div className="container-page">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-12">
          <Reveal className="flex max-w-2xl flex-col gap-3">
            <p className="text-eyebrow text-clay">Bine ai revenit, {firstName}</p>
            <h2 id="pentru-tine" className="text-display-lg">
              Recomandat pentru tine
            </h2>
            {row ? (
              <p className="text-ink-muted">
                {row.source === "quiz"
                  ? "Pe baza răspunsurilor din ultimul tău quiz aromatic."
                  : "Pe baza produselor tale favorite."}
              </p>
            ) : null}
          </Reveal>
          {row ? (
            <Button asChild variant="link">
              <Link href="/cont/recomandari">
                Toate recomandările <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : null}
        </div>
        {row ? (
          <Stagger as="ul" className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4">
            {row.items.map(({ product, reason }) => (
              <StaggerItem as="li" key={product.id}>
                <ProductCard product={product} reason={reason} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <Reveal className="flex flex-col items-start gap-4 rounded-xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <p className="flex items-start gap-3 text-ink-muted">
              <Sparkles aria-hidden className="mt-1 size-5 shrink-0 text-forest" />
              Spune-ne ce arome și momente îți plac, iar aici îți vom arăta produsele potrivite.
            </p>
            <Button asChild>
              <Link href="/quiz">Fă quiz-ul</Link>
            </Button>
          </Reveal>
        )}
      </div>
    </section>
  );
}
