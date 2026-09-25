import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AccountHeader } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { OrderDetail, orderDate } from "@/features/orders/order-detail";
import { getUserOrder } from "@/services/orders/orders";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ numar: string }>;
}): Promise<Metadata> {
  const { numar } = await params;
  return { title: `Comanda ${numar}`, robots: { index: false, follow: false } };
}

export default async function OrderPage({ params }: { params: Promise<{ numar: string }> }) {
  const { numar } = await params;
  const { user } = await requireUser(`/cont/comenzi/${numar}`);
  const order = await getUserOrder(user.id, numar);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/cont/comenzi"
        className="inline-flex items-center gap-1.5 self-start text-sm font-semibold text-forest hover:underline"
      >
        <ArrowLeft aria-hidden className="size-4" /> Toate comenzile
      </Link>
      <AccountHeader
        title={`Comanda ${order.number}`}
        description={`Plasată pe ${orderDate.format(order.placedAt)}.`}
      />
      <OrderDetail order={order} />
    </div>
  );
}
