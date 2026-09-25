import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountHeader } from "@/features/account/section";

export const metadata: Metadata = {
  title: "Rezultate quiz",
  robots: { index: false, follow: false },
};

export default function QuizResultsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Rezultate quiz"
        description="Rezultatele quiz-ului aromatic, salvate automat în contul tău."
      />
      <EmptyState
        className="mx-0 max-w-none rounded-xl border border-line bg-surface"
        illustration={
          <div className="grid size-full place-items-center rounded-full bg-forest-soft text-forest">
            <Sparkles aria-hidden className="size-1/3" />
          </div>
        }
        title="Nu ai făcut încă quiz-ul."
        description="Fă quiz-ul ca să descoperi de unde să începi."
        actions={
          <Button asChild>
            <Link href="/quiz">Începe quiz-ul</Link>
          </Button>
        }
      />
    </div>
  );
}
