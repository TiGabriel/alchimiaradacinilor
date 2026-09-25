import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProductImage } from "@/components/media/product-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountHeader } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { productHref } from "@/services/catalog/product-types";
import { listUserQuizResults } from "@/services/quiz/quiz";

export const metadata: Metadata = {
  title: "Rezultate quiz",
  robots: { index: false, follow: false },
};

const dateFormat = new Intl.DateTimeFormat("ro-RO", { dateStyle: "long" });

export default async function QuizResultsPage() {
  const { user } = await requireUser("/cont/quiz");
  const results = await listUserQuizResults(user.id);
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Rezultate quiz"
        description="Rezultatele quiz-ului aromatic, salvate automat în contul tău."
      />
      {results.length ? (
        <ul className="flex flex-col gap-4">
          {results.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-semibold">Quiz din {dateFormat.format(r.createdAt)}</p>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/quiz/rezultat/${r.id}`}>Vezi rezultatul</Link>
                </Button>
              </div>
              {r.answers.length ? (
                <p className="text-sm text-ink-muted">{r.answers.join(" · ")}</p>
              ) : null}
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {r.items.map(({ product }) => (
                  <li key={product.id}>
                    <Link href={productHref(product)} className="flex flex-col gap-1">
                      <span className="overflow-hidden rounded-md">
                        <ProductImage
                          name={product.name}
                          productType={product.productType}
                          image={product.images[0]}
                          tone={product.tone}
                          aspect="square"
                          sizes="96px"
                        />
                      </span>
                      <span className="truncate text-xs font-semibold">{product.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mx-0 max-w-none rounded-xl border border-line bg-surface"
          illustration={
            <div className="grid size-full place-items-center rounded-full bg-forest-soft text-forest">
              <Sparkles aria-hidden className="size-1/3" />
            </div>
          }
          title="Nu ai făcut încă quiz-ul."
          description="Fă quiz-ul ca să descoperi de unde să începi."
          actions={
            <Button asChild>
              <Link href="/quiz">Începe quiz-ul</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
