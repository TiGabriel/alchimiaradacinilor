import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteArticleAction } from "@/features/admin/content/actions";
import { ArticleForm } from "@/features/admin/content/article-form";
import { articleToDraft } from "@/features/admin/content/defaults";
import { DeleteButton } from "@/features/admin/delete-button";
import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getAdminArticle, getContentOptions } from "@/services/admin/content";

export const metadata: Metadata = { title: "Articol" };

export default async function ArticleAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { user } = await requirePermission("content:edit");
  const actor = { id: user.id, roles: user.roles };
  const [article, options] = await Promise.all([
    getAdminArticle(actor, id),
    getContentOptions(actor),
  ]);
  if (!article) notFound();
  return (
    <>
      <AdminPageHeader
        title={article.title}
        description={article.isDemo ? "Articol demonstrativ" : undefined}
        back={{ href: "/admin/jurnal", label: "Jurnal" }}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/jurnal/${article.slug}?previzualizare=1`} target="_blank">
              {article.status === "PUBLISHED" ? "Vezi în magazin" : "Previzualizează pagina"}{" "}
              <ExternalLink aria-hidden />
            </Link>
          </Button>
        }
      />
      <ArticleForm articleId={article.id} initial={articleToDraft(article)} options={options} />
      <AdminCard title="Zonă periculoasă" className="border-danger/30">
        <p className="text-sm text-ink-muted">
          Ștergerea este definitivă. Pentru a-l ascunde, trece-l la „Arhivat”.
        </p>
        <div>
          <DeleteButton
            action={deleteArticleAction.bind(null, article.id)}
            confirmText={`Ștergi definitiv „${article.title}”?`}
            redirectTo="/admin/jurnal"
            label="Șterge articolul"
          />
        </div>
      </AdminCard>
    </>
  );
}
