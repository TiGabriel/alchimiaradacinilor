import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { FavoritesView } from "@/features/wishlist/favorites-view";

export const metadata: Metadata = { title: "Salvate", robots: { index: false, follow: false } };

export default function FavoritesPage() {
  return (
    <div className="container-page pb-(--spacing-section)">
      <div className="pt-6 md:pt-8">
        <Breadcrumbs items={[{ label: "Salvate" }]} />
      </div>
      <div className="flex flex-col gap-3 py-8 md:py-10">
        <p className="text-eyebrow text-clay">Lista ta</p>
        <h1 className="text-display-lg">Salvate</h1>
      </div>
      <FavoritesView />
    </div>
  );
}
