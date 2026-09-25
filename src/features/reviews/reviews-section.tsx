import { BadgeCheck, MessageSquareHeart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { RatingStars, reviewCountLabel } from "@/components/ui/rating-stars";
import type { PublicReview } from "@/services/reviews/reviews";
import {
  distributionPercentages,
  type RatingSummary,
  type ReviewEligibility,
} from "@/services/reviews/rules";

import { ReviewForm } from "./review-form";

const reviewDate = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});

function Distribution({ summary }: { summary: RatingSummary }) {
  const percentages = distributionPercentages(summary);
  return (
    <ol className="flex flex-col gap-1.5" aria-label="Distribuția notelor">
      {[5, 4, 3, 2, 1].map((star) => (
        <li key={star} className="flex items-center gap-3 text-sm">
          <span className="w-12 shrink-0 text-ink-muted">
            {star} {star === 1 ? "stea" : "stele"}
          </span>
          <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-paper-deep">
            <span
              className="block h-full rounded-full bg-ochre"
              style={{ width: `${percentages[star - 1]}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right text-ink-muted tabular-nums">
            {summary.distribution[star - 1]}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function ReviewsSection({
  product,
  summary,
  reviews,
  eligibility,
}: {
  product: { id: string; slug: string; name: string };
  summary: RatingSummary;
  reviews: PublicReview[];
  eligibility: ReviewEligibility;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid items-center gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10">
        {summary.count > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="font-display text-5xl">{summary.average?.toFixed(1).replace(".", ",")}</p>
            <RatingStars value={summary.average} />
            <p className="text-sm text-ink-muted">{reviewCountLabel(summary.count)}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <MessageSquareHeart aria-hidden className="size-8 text-sage" />
            <p className="font-display text-2xl">Încă nu există recenzii.</p>
          </div>
        )}
        {summary.count > 0 ? <Distribution summary={summary} /> : null}
      </div>

      <div className="flex min-w-0 flex-col gap-8">
        <div className="rounded-xl border border-line bg-surface p-5 md:p-7">
          <h3 className="mb-4 font-display text-2xl">Scrie o recenzie</h3>
          {eligibility.canReview ? (
            <>
              {eligibility.existing?.status === "REJECTED" ? (
                <p className="mb-4 rounded-lg bg-paper-deep p-3 text-sm text-ink-muted">
                  Recenzia ta anterioară nu a fost publicată
                  {eligibility.existing &&
                  "rejectionReason" in eligibility.existing &&
                  eligibility.existing.rejectionReason
                    ? `: ${eligibility.existing.rejectionReason}`
                    : "."}{" "}
                  O poți rescrie mai jos.
                </p>
              ) : null}
              <ReviewForm
                productId={product.id}
                productSlug={product.slug}
                productName={product.name}
              />
            </>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <p className="text-ink-muted">{eligibility.message}</p>
              {eligibility.reason === "signed-out" ? (
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`/cont/autentificare?next=${encodeURIComponent(`/produs/${product.slug}#recenzii`)}`}
                  >
                    Autentifică-te
                  </Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>

        {reviews.length ? (
          <ul className="flex flex-col divide-y divide-line">
            {reviews.map((review) => (
              <li key={review.id} className="flex flex-col gap-3 py-6 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <RatingStars value={review.rating} size="sm" />
                  <time
                    dateTime={review.createdAt.toISOString()}
                    className="text-sm text-ink-muted"
                  >
                    {reviewDate.format(review.createdAt)}
                  </time>
                </div>
                {review.title ? <p className="font-display text-xl">{review.title}</p> : null}
                <p className="whitespace-pre-line text-ink-muted">{review.body}</p>
                {review.image ? (
                  <a
                    href={review.image.url}
                    target="_blank"
                    rel="noopener"
                    className="w-28 overflow-hidden rounded-lg border border-line"
                  >
                    <Image
                      src={review.image.url}
                      alt={`Fotografie adăugată de ${review.author}`}
                      width={review.image.width ?? 400}
                      height={review.image.height ?? 400}
                      sizes="112px"
                      className="aspect-square object-cover"
                    />
                  </a>
                ) : null}
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  {review.author}
                  {review.verified ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
                      <BadgeCheck aria-hidden className="size-3.5" /> Cumpărare verificată
                    </span>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
