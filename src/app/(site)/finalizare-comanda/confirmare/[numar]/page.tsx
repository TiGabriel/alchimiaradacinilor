import { CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { TrackEvent } from "@/features/analytics/track-event";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { CartRefresh } from "@/features/cart/cart-refresh";
import { OrderDetail, orderDate } from "@/features/orders/order-detail";
import { emailConfigured } from "@/lib/email";
import { getUserOrder } from "@/services/orders/orders";

export const metadata: Metadata = {
  title: "Comanda a fost înregistrată",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({ params }: { params: Promise<{ numar: string }> }) {
  const { numar } = await params;
  const { user } = await requireUser(`/finalizare-comanda/confirmare/${numar}`);
  const order = await getUserOrder(user.id, numar);
  if (!order) notFound();

  return (
    <div className="container-page flex max-w-4xl flex-col gap-10 pt-10 pb-(--spacing-section) md:pt-16">
      <CartRefresh />
      <TrackEvent
        name="order_completed"
        props={{
          value: order.total,
          items: order.items.reduce((n, i) => n + i.quantity, 0),
          payment: order.paymentMethod,
        }}
      />
      <header className="flex flex-col items-center gap-4 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-forest-soft text-forest">
          <CheckCircle2 aria-hidden className="size-8" />
        </span>
        <h1 className="text-display-lg">Comanda ta a fost înregistrată.</h1>
        <p className="max-w-xl text-lg text-ink-muted">
          Mulțumim, {user.firstName}! Numărul comenzii este{" "}
          <strong className="text-ink">{order.number}</strong>, plasată pe{" "}
          {orderDate.format(order.placedAt)}.
          {emailConfigured() ? ` Ți-am trimis confirmarea la ${order.email}.` : ""}
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild>
            <Link href={`/cont/comenzi/${order.number}`}>Urmărește comanda</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/produse">Continuă cumpărăturile</Link>
          </Button>
        </div>
      </header>
      <OrderDetail order={order} />
    </div>
  );
}
