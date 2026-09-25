import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TAXONOMY_CONFIG } from "@/features/admin/taxonomy/config";
import { TaxonomyEditor } from "@/features/admin/taxonomy/taxonomy-editor";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { listTaxonomy } from "@/services/admin/taxonomy";
import { isTaxonomyKind } from "@/validation/admin/taxonomy";

type Params = Promise<{ taxonomie: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { taxonomie } = await params;
  return { title: isTaxonomyKind(taxonomie) ? TAXONOMY_CONFIG[taxonomie].title : "Administrare" };
}

export default async function TaxonomyPage({ params }: { params: Params }) {
  const { taxonomie } = await params;
  if (!isTaxonomyKind(taxonomie)) notFound();
  const { user } = await requirePermission("catalog:edit");
  const config = TAXONOMY_CONFIG[taxonomie];
  const rows = await listTaxonomy({ id: user.id, roles: user.roles }, taxonomie);
  return (
    <>
      <AdminPageHeader title={config.title} description={config.description} />
      <TaxonomyEditor
        kind={taxonomie}
        singular={config.singular}
        fields={config.fields}
        rows={rows}
      />
    </>
  );
}
