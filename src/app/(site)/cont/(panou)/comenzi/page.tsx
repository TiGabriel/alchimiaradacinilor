import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountHeader } from "@/features/account/section";

export const metadata: Metadata = { title: "Comenzi", robots: { index: false, follow: false } };

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Comenzi"
        description="Istoricul comenzilor tale, cu starea fiecărei livrări."
      />
      <EmptyState
        className="mx-0 max-w-none rounded-xl border border-line bg-surface"
        illustration={
          <div className="grid size-full place-items-center rounded-full bg-forest-soft text-forest">
            <ClipboardList aria-hidden className="size-1/3" />
          </div>
        }
        title="Nu ai plasat încă nicio comandă."
        description="Comenzile tale vor apărea aici, cu toate detaliile de livrare."
        actions={
          <Button asChild>
            <Link href="/produse">Descoperă produsele</Link>
          </Button>
        }
      />
    </div>
  );
}
