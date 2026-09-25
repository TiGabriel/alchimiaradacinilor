import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Reveal } from "@/components/motion";
import { NeedCards } from "@/features/discover/need-cards";
import { getNeedsWithCounts } from "@/services/catalog/taxonomy";

export const metadata: Metadata = {
  title: "Descoperă după nevoie",
  description:
    "Relaxare, energie, concentrare, o casă proaspătă — alege produsele potrivite momentului tău.",
  alternates: { canonical: "/descopera/nevoi" },
};

export default async function NeedsPage() {
  const needs = await getNeedsWithCounts();
  return (
    <div className="container-page pb-(--spacing-section)">
      <div className="pt-6 md:pt-8">
        <Breadcrumbs
          items={[{ label: "Descoperă", href: "/descopera" }, { label: "După nevoie" }]}
        />
      </div>
      <Reveal className="flex max-w-2xl flex-col gap-3 py-10 md:py-14">
        <p className="text-eyebrow text-clay">Descoperă</p>
        <h1 className="text-display-lg">Pornește de la momentul tău</h1>
        <p className="text-lg text-ink-muted">
          Alege ce îți dorești de la ziua de azi, iar noi îți arătăm aromele care se potrivesc.
        </p>
      </Reveal>
      <NeedCards needs={needs} />
    </div>
  );
}
