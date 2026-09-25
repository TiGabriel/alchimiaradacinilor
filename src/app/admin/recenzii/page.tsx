import type { Metadata } from "next";
import Link from "next/link";

import { ReviewModeration } from "@/features/admin/marketing/review-moderation";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { cn } from "@/lib/utils";
import { listReviewsForModeration } from "@/services/admin/moderation";

export const metadata: Metadata = { title: "Recenzii" };

const tabs = [
  ["PENDING", "De moderat"],
  ["APPROVED", "Publicate"],
  ["REJECTED", "Respinse"],
] as const;

export default async function ReviewsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ stare?: string }>;
}) {
  const { user } = await requirePermission("content:edit");
  const { stare } = await searchParams;
  const status = tabs.find(([s]) => s === stare)?.[0] ?? "PENDING";
  const { reviews, counts } = await listReviewsForModeration(
    { id: user.id, roles: user.roles },
    status,
  );
  return (
    <>
      <AdminPageHeader
        title="Recenzii"
        description="Recenziile apar în magazin doar după aprobare. Ratingul produsului se actualizează automat."
      />
      <nav aria-label="Filtru stare" className="flex flex-wrap gap-2">
        {tabs.map(([s, label]) => (
          <Link
            key={s}
            href={`/admin/recenzii?stare=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-semibold",
              s === status
                ? "border-forest bg-forest text-ink-inverse"
                : "border-line hover:border-forest",
            )}
          >
            {label} ({counts[s] ?? 0})
          </Link>
        ))}
      </nav>
      <ReviewModeration
        reviews={reviews.map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
          rejectionReason: r.rejectionReason,
          verified: r.orderItemId !== null,
          author: `${r.user.firstName} ${r.user.lastName}`,
          email: r.user.email,
          product: r.product,
          imageUrl: r.image?.url ?? null,
          status,
        }))}
      />
    </>
  );
}
