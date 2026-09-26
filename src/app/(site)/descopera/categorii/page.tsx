import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Reveal } from "@/components/motion";
import { CategoryDirectory } from "@/features/discover/category-cards";
import { getCategoryTree } from "@/services/catalog/categories";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Descoperă după categorie",
    description: "Uleiuri individuale, amestecuri, kit-uri, difuzoare, accesorii și îngrijire.",
    path: "/descopera/categorii",
  });
}

export default async function CategoriesPage() {
  const tree = await getCategoryTree();
  return (
    <div className="container-page pb-(--spacing-section)">
      <div className="pt-6 md:pt-8">
        <Breadcrumbs
          items={[{ label: "Descoperă", href: "/descopera" }, { label: "După categorie" }]}
        />
      </div>
      <Reveal className="flex max-w-2xl flex-col gap-3 py-10 md:py-14">
        <p className="text-eyebrow text-clay">Descoperă</p>
        <h1 className="text-display-lg">Toate categoriile</h1>
        <p className="text-lg text-ink-muted">Răsfoiește colecția după tipul de produs.</p>
      </Reveal>
      <CategoryDirectory categories={tree} />
    </div>
  );
}
