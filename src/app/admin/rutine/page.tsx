import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminTable, StatusDot, td, th } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { listAdminRoutines } from "@/services/admin/content";
import { timeOfDayLabels } from "@/services/routines/routines";

export const metadata: Metadata = { title: "Rutine" };

export default async function RoutinesAdminPage() {
  const { user } = await requirePermission("content:edit");
  const routines = await listAdminRoutines({ id: user.id, roles: user.roles });
  return (
    <>
      <AdminPageHeader
        title="Rutine"
        description="Ritualuri pas cu pas, cu produsele lor."
        actions={
          <Button asChild>
            <Link href="/admin/rutine/nou">
              <Plus aria-hidden /> Rutină nouă
            </Link>
          </Button>
        }
      />
      <AdminTable caption="Lista rutinelor">
        <thead className="border-b border-line bg-paper-deep/50">
          <tr>
            <th className={th}>Rutină</th>
            <th className={th}>Moment</th>
            <th className={`${th} text-right`}>Pași</th>
            <th className={`${th} text-right`}>Produse</th>
            <th className={`${th} text-right`}>Salvări</th>
            <th className={th}>Stare</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {routines.map((r) => (
            <tr key={r.id} className="hover:bg-paper-deep/40">
              <td className={td}>
                <Link
                  href={`/admin/rutine/${r.id}`}
                  className="flex flex-col font-semibold hover:text-forest"
                >
                  {r.title}
                  <span className="text-xs font-normal text-ink-muted">
                    /rutine/{r.slug}
                    {r.isDemo ? " · demo" : ""}
                    {r.featured ? " · recomandată" : ""}
                  </span>
                </Link>
              </td>
              <td className={td}>{timeOfDayLabels[r.timeOfDay]}</td>
              <td className={`${td} text-right tabular-nums`}>{r._count.steps}</td>
              <td className={`${td} text-right tabular-nums`}>{r._count.products}</td>
              <td className={`${td} text-right tabular-nums`}>{r._count.savedBy}</td>
              <td className={td}>
                <StatusDot tone={r.active ? "ok" : "off"}>
                  {r.active ? "Activă" : "Inactivă"}
                </StatusDot>
              </td>
            </tr>
          ))}
        </tbody>
      </AdminTable>
    </>
  );
}
