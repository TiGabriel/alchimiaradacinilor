import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { CartPage } from "@/features/cart/cart-page";

export const metadata: Metadata = { title: "Coșul tău", robots: { index: false, follow: false } };

export default function CosPage() {
  return (
    <div className="container-page pb-(--spacing-section)">
      <div className="pt-6 md:pt-8">
        <Breadcrumbs items={[{ label: "Coș" }]} />
      </div>
      <h1 className="py-8 text-display-lg md:py-10">Coșul tău</h1>
      <CartPage />
    </div>
  );
}
