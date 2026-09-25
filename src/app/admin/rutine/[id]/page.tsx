import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { deleteRoutineAction } from "@/features/admin/content/actions";
import { routineToDraft } from "@/features/admin/content/defaults";
import { RoutineForm } from "@/features/admin/content/routine-form";
import { DeleteButton } from "@/features/admin/delete-button";
import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getAdminRoutine, getContentOptions } from "@/services/admin/content";

export const metadata: Metadata = { title: "Rutină" };

export default async function RoutineAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { user } = await requirePermission("content:edit");
  const actor = { id: user.id, roles: user.roles };
  const [routine, options] = await Promise.all([
    getAdminRoutine(actor, id),
    getContentOptions(actor),
  ]);
  if (!routine) notFound();
  return (
    <>
      <AdminPageHeader
        title={routine.title}
        description={routine.isDemo ? "Rutină demonstrativă" : undefined}
        back={{ href: "/admin/rutine", label: "Rutine" }}
        actions={
          routine.active ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/rutine/${routine.slug}`} target="_blank">
                Vezi în magazin <ExternalLink aria-hidden />
              </Link>
            </Button>
          ) : null
        }
      />
      <RoutineForm routineId={routine.id} initial={routineToDraft(routine)} options={options} />
      <AdminCard title="Zonă periculoasă" className="border-danger/30">
        <p className="text-sm text-ink-muted">
          Ștergerea elimină și rutina din listele salvate de clienți. Poți doar s-o dezactivezi.
        </p>
        <div>
          <DeleteButton
            action={deleteRoutineAction.bind(null, routine.id)}
            confirmText={`Ștergi definitiv „${routine.title}”?`}
            redirectTo="/admin/rutine"
            label="Șterge rutina"
          />
        </div>
      </AdminCard>
    </>
  );
}
