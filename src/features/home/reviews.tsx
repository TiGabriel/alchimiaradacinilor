import { BadgeCheck, Quote } from "lucide-react";
import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { RatingStars } from "@/components/ui/rating-stars";
import type { HomeReview } from "@/services/home/home";

/** Approved customer reviews, exactly as written (never invented testimonials). */
export function ReviewsSection({ reviews }: { reviews: HomeReview[] }) {
  return (
    <section aria-labelledby="recenzii" className="py-(--spacing-section)">
      <div className="container-page">
        <Reveal className="mb-10 flex max-w-2xl flex-col gap-3 md:mb-14">
          <p className="text-eyebrow text-clay">Din recenzii</p>
          <h2 id="recenzii" className="text-display-lg">
            Ce spun clienții noștri
          </h2>
        </Reveal>
        <Stagger as="ul" className="grid gap-5 md:grid-cols-3 md:gap-6">
          {reviews.map((review) => (
            <StaggerItem as="li" key={review.id}>
              <figure className="flex h-full flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-xs md:p-7">
                <div className="flex items-center justify-between gap-3">
                  <RatingStars value={review.rating} size="sm" />
                  <Quote aria-hidden className="size-6 text-sage" />
                </div>
                <blockquote className="flex flex-col gap-2">
                  {review.title ? (
                    <p className="font-display text-xl leading-snug">{review.title}</p>
                  ) : null}
                  <p className="line-clamp-6 text-ink-muted">{review.body}</p>
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
                  <Link
                    href={`/produs/${review.product.slug}#recenzii`}
                    className="text-ink-muted underline-offset-2 hover:text-forest hover:underline"
                  >
                    despre {review.product.name}
                  </Link>
                </figcaption>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
