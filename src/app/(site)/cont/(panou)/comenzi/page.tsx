import { ChevronRight, ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SmartImage } from "@/components/media/smart-image";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { AccountHeader } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { OrderStatusBadge, orderDate } from "@/features/orders/order-detail";
import { formatMoney } from "@/lib/money";
import { pluralRo } from "@/lib/plural";
import { listUserOrders } from "@/services/orders/orders";

export const metadata: Metadata = { title: "Comenzi", robots: { index: false, follow: false } };

export default async function OrdersPage() {
  const { user } = await requireUser("/cont/comenzi");
  const orders = await listUserOrders(user.id);

  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Comenzi"
        description="Istoricul comenzilor tale, cu starea fiecărei livrări."
      />
      {orders.length === 0 ? (
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
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/cont/comenzi/${order.number}`}
                className="group flex items-center gap-4 rounded-xl border border-line bg-surface p-4 shadow-xs transition-shadow hover:shadow-soft md:p-5"
              >
                <div className="hidden shrink-0 -space-x-3 sm:flex" aria-hidden>
                  {order.previews.map((p, i) => (
                    <div key={i} className="w-12 overflow-hidden rounded-md ring-2 ring-surface">
                      <SmartImage
                        src={p.imageUrl}
                        alt=""
                        aspect="square"
                        sizes="48px"
                        placeholderKind="bottle"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{order.number}</span>
                    <OrderStatusBadge status={order.status} />
                  </span>
                  <span className="text-sm text-ink-muted">
                    {orderDate.format(order.placedAt)} ·{" "}
                    {pluralRo(order.itemCount, "produs", "produse")}
                  </span>
                </div>
                <span className="font-semibold tabular-nums">
                  {formatMoney(order.total, order.currency)}
                </span>
                <ChevronRight
                  aria-hidden
                  className="size-5 text-ink-muted transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
