import { notFound } from "next/navigation";

import { ComingSoon, comingSoonMetadata } from "@/components/states/coming-soon";
import { getCategoryTree } from "@/services/catalog/categories";
import { findCategoryPath } from "@/services/catalog/category-tree";

export const metadata = comingSoonMetadata("produse");

/** Phase 2 placeholder for category pages (valid categories only). */
export default async function CategoryPlaceholder(props: PageProps<"/produse/[...segments]">) {
  const { segments } = await props.params;
  const path = findCategoryPath(await getCategoryTree(), segments);
  if (!path) notFound();
  return <ComingSoon page="produse" />;
}
