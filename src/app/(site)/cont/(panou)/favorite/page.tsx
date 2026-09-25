import type { Metadata } from "next";

import { AccountHeader } from "@/features/account/section";
import { FavoritesView } from "@/features/wishlist/favorites-view";

export const metadata: Metadata = { title: "Favorite", robots: { index: false, follow: false } };

export default function AccountFavoritesPage() {
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Favorite"
        description="Produsele salvate în contul tău, disponibile pe orice dispozitiv."
      />
      <FavoritesView />
    </div>
  );
}
