import { BadgeCheck, Quote } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingStars } from "@/components/ui/rating-stars";
import { productHref } from "@/services/catalog/product-types";
import { listApprovedReviews } from "@/services/reviews/reviews";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Recenzii",
    description:
      "Ce spun membrii comunității despre uleiurile și produsele doTERRA pe care le folosesc.",
    path: "/recenzii",
  });
}

const reviewDate = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});

/**
 * Member reviews, as written and moderated. Editorial reviews (verdict, pros and cons)
 * join this page in phase 6 of docs/PIVOT_PLAN.md.
 */
export default async function ReviewsPage() {
  const reviews = await listApprovedReviews();
  return (
    <div className="container-page pb-(--spacing-section)">
      <div className="pt-6 md:pt-8">
        <Breadcrumbs items={[{ label: "Recenzii" }]} />
      </div>
      <Reveal className="flex max-w-(--container-prose) flex-col gap-5 py-10">
        <p className="text-eyebrow text-clay">Recenzii</p>
        <h1 className="text-display-xl text-balance">Din experiența celor care le folosesc</h1>
        <p className="text-lg text-ink-muted">
          Recenziile scrise de membrii comunității despre produsele pe care le-au încercat. Le citim
          pe toate înainte să apară aici. În curând publicăm și recenziile noastre: cum am testat
          fiecare produs, ce ne-a plăcut și ce nu.
        </p>
      </Reveal>

      {reviews.length > 0 ? (
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <li key={review.id}>
              <figure className="flex h-full flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <RatingStars value={review.rating} size="sm" />
                  <Quote aria-hidden className="size-6 text-sage" />
                </div>
                <blockquote className="flex flex-col gap-2">
                  {review.title ? (
                    <p className="font-display text-xl leading-snug">{review.title}</p>
                  ) : null}
                  <p className="whitespace-pre-line text-ink-muted">{review.body}</p>
                </blockquote>
                <figcaption className="mt-auto flex flex-col gap-1 border-t border-line pt-4 text-sm">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                    {review.author}
                    {review.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
                        <BadgeCheck aria-hidden className="size-3.5" /> Cumpărare verificată
                      </span>
                    ) : null}
                  </span>
                  <span className="text-ink-muted">
                    despre{" "}
                    <Link
                      href={`${productHref(review.product)}#recenzii`}
                      className="font-semibold text-forest underline-offset-2 hover:underline"
                    >
                      {review.product.name}
                    </Link>
                    {" · "}
                    <time dateTime={review.createdAt.toISOString()}>
                      {reviewDate.format(review.createdAt)}
                    </time>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          headingLevel="h2"
          title="Încă nu avem recenzii publicate"
          description="Ai încercat un produs despre care scriem? Spune-le și altora cum ți s-a părut, din pagina produsului."
          actions={
            <Button asChild>
              <Link href="/produse">Vezi produsele</Link>
            </Button>
          }
        />
      )}

      <p className="mt-10 max-w-(--container-prose) text-ink-muted">
        Vrei să scrii o recenzie? Intră în{" "}
        <Link href="/cont" className="text-forest underline underline-offset-2">
          contul tău
        </Link>
        , deschide pagina produsului și găsești formularul la secțiunea „Recenzii”.
      </p>
    </div>
  );
}
