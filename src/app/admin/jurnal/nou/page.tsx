import type { Metadata } from "next";

import { ArticleForm } from "@/features/admin/content/article-form";
import { emptyArticle } from "@/features/admin/content/defaults";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getContentOptions } from "@/services/admin/content";

export const metadata: Metadata = { title: "Articol nou" };

export default async function NewArticlePage() {
  const { user } = await requirePermission("content:edit");
  const options = await getContentOptions({ id: user.id, roles: user.roles });
  return (
    <>
      <AdminPageHeader title="Articol nou" back={{ href: "/admin/jurnal", label: "Jurnal" }} />
      <ArticleForm initial={emptyArticle()} options={options} />
    </>
  );
}
