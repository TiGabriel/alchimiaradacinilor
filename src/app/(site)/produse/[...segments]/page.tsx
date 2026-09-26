import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CatalogView } from "@/features/catalog/catalog-view";
import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref, findCategoryPath } from "@/services/catalog/category-tree";
import { countActiveFilters, parseCatalogParams } from "@/services/catalog/listing";
import { getCatalogPage } from "@/services/catalog/products";
import { pageMetadata } from "@/services/seo";

type Props = PageProps<"/produse/[...segments]">;

async function resolve(props: Props) {
  const { segments } = await props.params;
  return findCategoryPath(await getCategoryTree(), segments);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const path = await resolve(props);
  if (!path) return {};
  const current = path.subcategory ?? path.category;
  const filters = parseCatalogParams(await props.searchParams);
  return pageMetadata({
    title: path.subcategory
      ? `${path.subcategory.name} · ${path.category.name}`
      : path.category.name,
    description: current.description ?? `Descoperă produsele din categoria ${current.name}.`,
    path: categoryHref(current, path.subcategory ? path.category : null),
    noIndex: countActiveFilters(filters) > 0 || filters.sort !== "recomandate",
  });
}

export default async function CategoryPage(props: Props) {
  const path = await resolve(props);
  if (!path) notFound();

  const { category, subcategory } = path;
  const current = subcategory ?? category;
  const basePath = categoryHref(current, subcategory ? category : null);
  const filters = parseCatalogParams(await props.searchParams);
  const data = await getCatalogPage(current, filters);

  const links =
    category.children.length > 0
      ? [
          {
            label: "Toate",
            href: categoryHref(category),
            active: !subcategory,
            count: category.productCount,
          },
          ...category.children.map((child) => ({
            label: child.name,
            href: categoryHref(child, category),
            active: child.id === subcategory?.id,
            count: child.productCount,
          })),
        ]
      : undefined;

  return (
    <CatalogView
      eyebrow={subcategory ? category.name : "Categorie"}
      title={current.name}
      description={current.description}
      breadcrumbs={[
        { label: "Produse", href: "/produse" },
        ...(subcategory
          ? [{ label: category.name, href: categoryHref(category) }, { label: subcategory.name }]
          : [{ label: category.name }]),
      ]}
      basePath={basePath}
      data={data}
      filters={filters}
      links={links}
    />
  );
}
