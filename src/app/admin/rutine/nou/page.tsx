import type { Metadata } from "next";

import { emptyRoutine } from "@/features/admin/content/defaults";
import { RoutineForm } from "@/features/admin/content/routine-form";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { getContentOptions } from "@/services/admin/content";

export const metadata: Metadata = { title: "Rutină nouă" };

export default async function NewRoutinePage() {
  const { user } = await requirePermission("content:edit");
  const options = await getContentOptions({ id: user.id, roles: user.roles });
  return (
    <>
      <AdminPageHeader title="Rutină nouă" back={{ href: "/admin/rutine", label: "Rutine" }} />
      <RoutineForm initial={emptyRoutine()} options={options} />
    </>
  );
}
