import type { Metadata } from "next";

import { CatalogView } from "@/features/catalog/catalog-view";
import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref } from "@/services/catalog/category-tree";
import { countActiveFilters, parseCatalogParams } from "@/services/catalog/listing";
import { getCatalogPage } from "@/services/catalog/products";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(props: PageProps<"/produse">): Promise<Metadata> {
  const filters = parseCatalogParams(await props.searchParams);
  return pageMetadata({
    title: "Toate produsele",
    description:
      "Uleiuri esențiale, amestecuri, kit-uri, difuzoare și accesorii pentru ritualurile tale.",
    path: "/produse",
    // Filtered/sorted variants are not indexed; pagination stays crawlable.
    noIndex: countActiveFilters(filters) > 0 || filters.sort !== "recomandate",
  });
}

export default async function ProductsPage(props: PageProps<"/produse">) {
  const filters = parseCatalogParams(await props.searchParams);
  const [tree, data] = await Promise.all([getCategoryTree(), getCatalogPage(null, filters)]);

  return (
    <CatalogView
      eyebrow="Magazin"
      title="Toate produsele"
      description="Uleiuri esențiale, amestecuri, kit-uri, difuzoare și accesorii — alese pentru ritualurile tale de zi cu zi."
      breadcrumbs={[{ label: "Produse" }]}
      basePath="/produse"
      data={data}
      filters={filters}
      showCategoryFacet
      links={tree.map((c) => ({ label: c.name, href: categoryHref(c), count: c.productCount }))}
    />
  );
}
