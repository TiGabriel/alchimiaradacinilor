import type { Metadata } from "next";

import { Sprig } from "@/components/botanical";
import { BotanicalFloat, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { EmptyState } from "@/components/ui/empty-state";
import { NeedPicker } from "@/features/discover/need-picker";
import { RoutineCard } from "@/features/routines/routine-card";
import { getNeedsWithCounts } from "@/services/catalog/taxonomy";
import { listRoutines } from "@/services/routines/routines";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Rutine",
    description:
      "Ritualuri simple, pas cu pas, pentru dimineți luminoase, zile concentrate și seri liniștite.",
    path: "/rutine",
  });
}

export default async function RoutinesPage() {
  const [routines, needs] = await Promise.all([listRoutines(), getNeedsWithCounts()]);
  return (
    <div className="pb-(--spacing-section)">
      <section className="relative overflow-hidden">
        <BotanicalFloat className="absolute top-8 right-[6%] hidden w-36 md:block" drift={12}>
          <Sprig className="w-full text-sage/70" />
        </BotanicalFloat>
        <Reveal className="container-page flex max-w-3xl flex-col gap-4 py-14 md:py-20">
          <p className="text-eyebrow text-clay">Rutine</p>
          <h1 className="text-display-xl">Ritualuri mici, făcute cu intenție</h1>
          <p className="text-lg text-ink-muted">
            Nu ai nevoie de multe produse. Ai nevoie de câteva gesturi repetate în momentele
            potrivite ale zilei.
          </p>
        </Reveal>
      </section>
      <div className="container-page flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <p className="font-semibold">Caută după nevoie</p>
          <NeedPicker needs={needs} />
        </div>
        <h2 className="sr-only">Toate rutinele</h2>
        {routines.length ? (
          <Stagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {routines.map((r) => (
              <StaggerItem key={r.id}>
                <RoutineCard routine={r} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <EmptyState
            title="Rutinele sunt în pregătire"
            description="Revino curând pentru primele ritualuri pas cu pas."
          />
        )}
      </div>
    </div>
  );
}
