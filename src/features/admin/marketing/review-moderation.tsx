"use client";

import { BadgeCheck, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { RatingStars } from "@/components/ui/rating-stars";
import { toast } from "@/components/ui/toast";

import { moderateReviewAction } from "./actions";

export type ModerationReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
  rejectionReason: string | null;
  verified: boolean;
  author: string;
  email: string;
  product: { name: string; slug: string };
  imageUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

const date = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function ReviewCard({ review }: { review: ModerationReview }) {
  const router = useRouter();
  const [reason, setReason] = useState(review.rejectionReason ?? "");
  const [rejecting, setRejecting] = useState(false);
  const [pending, start] = useTransition();
  const decide = (decision: "APPROVED" | "REJECTED") =>
    start(async () => {
      const result = await moderateReviewAction({
        reviewId: review.id,
        decision,
        reason: decision === "REJECTED" ? reason : null,
      });
      if (!result.ok) {
        toast({ title: result.error, variant: "error" });
        return;
      }
      toast({
        title: decision === "APPROVED" ? "Recenzie publicată" : "Recenzie respinsă",
        variant: "success",
      });
      router.refresh();
    });
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/produs/${review.product.slug}#recenzii`}
          target="_blank"
          className="font-semibold hover:text-forest"
        >
          {review.product.name}
        </Link>
        <span className="text-xs text-ink-muted">{date.format(new Date(review.createdAt))}</span>
      </div>
      <RatingStars value={review.rating} size="sm" />
      {review.title ? <p className="font-display text-lg">{review.title}</p> : null}
      <p className="text-sm whitespace-pre-line text-ink-muted">{review.body}</p>
      {review.imageUrl ? (
        <a
          href={review.imageUrl}
          target="_blank"
          rel="noopener"
          className="text-sm font-semibold text-forest underline"
        >
          Vezi fotografia atașată
        </a>
      ) : null}
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{review.author}</span>
        <span className="text-ink-muted">{review.email}</span>
        {review.verified ? (
          <span className="inline-flex items-center gap-1 text-xs text-forest">
            <BadgeCheck aria-hidden className="size-3.5" /> cumpărare verificată
          </span>
        ) : null}
      </p>
      {review.status === "REJECTED" && review.rejectionReason ? (
        <p className="text-xs text-ink-muted">Motiv: {review.rejectionReason}</p>
      ) : null}
      {rejecting ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={`reason-${review.id}`} className="text-sm font-semibold">
            Motivul (îl vede autorul)
          </label>
          <input
            id={`reason-${review.id}`}
            value={reason}
            maxLength={300}
            onChange={(e) => setReason(e.target.value)}
            className="h-10 rounded-md border border-line-strong px-3 text-sm"
          />
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2 border-t border-line pt-3">
        {review.status !== "APPROVED" ? (
          <Button size="sm" onClick={() => decide("APPROVED")} loading={pending}>
            <Check aria-hidden /> Publică
          </Button>
        ) : null}
        {review.status !== "REJECTED" ? (
          rejecting ? (
            <Button
              size="sm"
              variant="outline"
              className="text-danger"
              onClick={() => decide("REJECTED")}
              loading={pending}
            >
              <X aria-hidden /> Confirmă respingerea
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setRejecting(true)}>
              <X aria-hidden /> Respinge
            </Button>
          )
        ) : null}
      </div>
    </li>
  );
}

export function ReviewModeration({ reviews }: { reviews: ModerationReview[] }) {
  if (!reviews.length)
    return (
      <p className="rounded-xl border border-line bg-surface p-8 text-center text-ink-muted">
        Nicio recenzie aici.
      </p>
    );
  return (
    <ul className="grid gap-4 lg:grid-cols-2">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </ul>
  );
}
