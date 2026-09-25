import { Wand2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountHeader } from "@/features/account/section";

export const metadata: Metadata = { title: "Recomandări", robots: { index: false, follow: false } };

export default function RecommendationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Recomandări"
        description="Produse alese pentru tine, pe baza răspunsurilor din quiz."
      />
      <EmptyState
        className="mx-0 max-w-none rounded-xl border border-line bg-surface"
        illustration={
          <div className="grid size-full place-items-center rounded-full bg-forest-soft text-forest">
            <Wand2 aria-hidden className="size-1/3" />
          </div>
        }
        title="Încă nu avem recomandări pentru tine."
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
