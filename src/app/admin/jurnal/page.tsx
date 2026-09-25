import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminTable, StatusDot, td, th } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { listAdminArticles } from "@/services/admin/content";

export const metadata: Metadata = { title: "Jurnal" };

const date = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});
const statusLabel = { DRAFT: "Ciornă", PUBLISHED: "Publicat", ARCHIVED: "Arhivat" } as const;

export default async function ArticlesAdminPage() {
  const { user } = await requirePermission("content:edit");
  const articles = await listAdminArticles({ id: user.id, roles: user.roles });
  const now = new Date();
  return (
    <>
      <AdminPageHeader
        title="Jurnal"
        description="Articole, ghiduri și povești. Categoriile jurnalului se gestionează din seed-ul de conținut."
        actions={
          <Button asChild>
            <Link href="/admin/jurnal/nou">
              <Plus aria-hidden /> Articol nou
            </Link>
          </Button>
        }
      />
      <AdminTable caption="Lista articolelor">
        <thead className="border-b border-line bg-paper-deep/50">
          <tr>
            <th className={th}>Articol</th>
            <th className={th}>Categorie</th>
            <th className={th}>Publicare</th>
            <th className={th}>Stare</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {articles.map((a) => {
            const scheduled = a.status === "PUBLISHED" && a.publishedAt && a.publishedAt > now;
            return (
              <tr key={a.id} className="hover:bg-paper-deep/40">
                <td className={td}>
                  <Link
                    href={`/admin/jurnal/${a.id}`}
                    className="flex flex-col font-semibold hover:text-forest"
                  >
                    {a.title}
                    <span className="text-xs font-normal text-ink-muted">
                      /jurnal/{a.slug}
                      {a.isDemo ? " · demo" : ""}
                      {a.featured ? " · principal" : ""}
                    </span>
                  </Link>
                </td>
                <td className={td}>{a.category?.name ?? "—"}</td>
                <td className={`${td} text-xs`}>
                  {a.publishedAt ? date.format(a.publishedAt) : "—"}
                </td>
                <td className={td}>
                  <StatusDot tone={a.status === "PUBLISHED" ? (scheduled ? "warn" : "ok") : "off"}>
                    {scheduled ? "Programat" : statusLabel[a.status]}
                  </StatusDot>
                </td>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>
    </>
  );
}
