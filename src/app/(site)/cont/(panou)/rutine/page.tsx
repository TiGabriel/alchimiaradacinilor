import { Moon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountHeader } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { listSavedRoutines } from "@/services/account/routines";

export const metadata: Metadata = {
  title: "Rutinele mele",
  robots: { index: false, follow: false },
};

export default async function SavedRoutinesPage() {
  const { user } = await requireUser("/cont/rutine");
  const saved = await listSavedRoutines(user.id);
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Rutinele mele"
        description="Ritualurile pe care le-ai salvat, ca să le regăsești ușor."
      />
      {saved.length ? (
        <ul className="grid gap-4 md:grid-cols-2">
          {saved.map((routine) => (
            <li key={routine.slug}>
              <Link
                href={`/rutine/${routine.slug}`}
                className="flex h-full flex-col gap-1 rounded-xl border border-line bg-surface p-5 hover:border-forest"
              >
                <span className="font-display text-lg">{routine.title}</span>
                <span className="text-sm text-ink-muted">{routine.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mx-0 max-w-none rounded-xl border border-line bg-surface"
          illustration={
            <div className="grid size-full place-items-center rounded-full bg-forest-soft text-forest">
              <Moon aria-hidden className="size-1/3" />
            </div>
          }
          title="Nu ai salvat încă nicio rutină."
          description="Când vei găsi un ritual care ți se potrivește, îl poți salva aici."
          actions={
            <Button asChild>
              <Link href="/rutine">Vezi rutinele</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
