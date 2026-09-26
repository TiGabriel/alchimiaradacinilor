import { Check, CircleDot, Landmark, MapPin, Package, Receipt, Wallet, X } from "lucide-react";
import Link from "next/link";

import { SmartImage } from "@/components/media/smart-image";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { formatAddressLines } from "@/services/orders/format";
import type { UserOrder } from "@/services/orders/orders";
import {
  ORDER_PROGRESS,
  orderStatusDescriptions,
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/services/orders/status";

export const orderDate = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Bucharest",
});
const orderDateTime = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

export function OrderStatusBadge({ status }: { status: UserOrder["status"] }) {
  const tone =
    status === "CANCELLED" || status === "REFUNDED"
      ? "neutral"
      : status === "DELIVERED"
        ? "forest"
        : "sage";
  return <Badge variant={tone}>{orderStatusLabels[status]}</Badge>;
}

/** Progress for active orders; closed orders show their final state instead. */
function OrderProgress({ order }: { order: UserOrder }) {
  if (order.status === "CANCELLED" || order.status === "REFUNDED")
    return (
      <p className="flex items-center gap-2 rounded-lg bg-paper-deep p-4 text-sm">
        <X aria-hidden className="size-4 text-clay" /> {orderStatusDescriptions[order.status]}
      </p>
    );
  const current = ORDER_PROGRESS.indexOf(order.status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Progresul comenzii">
      {ORDER_PROGRESS.map((status, i) => {
        const done = i <= current;
        return (
          <li
            key={status}
            className="flex flex-col gap-2"
            aria-current={i === current ? "step" : undefined}
          >
            <span className={cn("h-1.5 rounded-full", done ? "bg-forest" : "bg-line")} />
            <span
              className={cn(
                "text-xs",
                i === current ? "font-semibold text-ink" : "text-ink-muted",
                "max-sm:sr-only",
              )}
            >
              {orderStatusLabels[status]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function AddressBlock({
  title,
  address,
}: {
  title: string;
  address: UserOrder["shippingAddress"];
}) {
  if (!address) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <MapPin aria-hidden className="size-4 text-forest" /> {title}
      </h3>
      <address className="text-sm leading-relaxed text-ink-muted not-italic">
        {formatAddressLines(address).map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </address>
    </div>
  );
}

export function OrderDetail({ order }: { order: UserOrder }) {
  const money = (v: number) => formatMoney(v, order.currency);
  const sameBilling =
    order.billingAddress &&
    order.shippingAddress &&
    formatAddressLines(order.billingAddress).join() ===
      formatAddressLines(order.shippingAddress).join();

  return (
    <div className="flex flex-col gap-8">
      <section
        aria-labelledby="stare"
        className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 md:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="stare" className="font-display text-2xl">
            {orderStatusLabels[order.status]}
          </h2>
          <span className="text-sm text-ink-muted">
            Plată: {paymentMethodLabels[order.paymentMethod]} ·{" "}
            {paymentStatusLabels[order.paymentStatus]}
          </span>
        </div>
        <p className="text-ink-muted">{orderStatusDescriptions[order.status]}</p>
        <OrderProgress order={order} />
      </section>

      {order.paymentInstructions.length ? (
        <section
          aria-labelledby="plata"
          className="flex flex-col gap-3 rounded-xl border border-forest/25 bg-forest-soft/40 p-5 md:p-6"
        >
          <h2 id="plata" className="flex items-center gap-2 font-semibold">
            {order.paymentMethod === "BANK_TRANSFER" ? (
              <Landmark aria-hidden className="size-5 text-forest" />
            ) : (
              <Wallet aria-hidden className="size-5 text-forest" />
            )}{" "}
            {paymentMethodLabels[order.paymentMethod]}
          </h2>
          <ul className="flex flex-col gap-1 text-sm">
            {order.paymentInstructions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="produse" className="flex flex-col gap-4">
        <h2 id="produse" className="flex items-center gap-2 font-display text-2xl">
          <Package aria-hidden className="size-5 text-forest" /> Produse
        </h2>
        <ul className="flex flex-col divide-y divide-line rounded-xl border border-line bg-surface">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-4 p-4">
              <div className="w-16 shrink-0 overflow-hidden rounded-md">
                <SmartImage
                  src={item.imageUrl}
                  alt=""
                  aspect="square"
                  sizes="64px"
                  placeholderKind="bottle"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                {item.productSlug && item.productId ? (
                  <Link
                    href={`/produs/${item.productSlug}`}
                    className="font-semibold hover:text-forest"
                  >
                    {item.productName}
                  </Link>
                ) : (
                  <span className="font-semibold">{item.productName}</span>
                )}
                <span className="text-sm text-ink-muted">
                  {item.quantity} × {money(item.unitPrice)}
                </span>
              </div>
              <span className="font-semibold tabular-nums">
                {money(item.unitPrice * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section
          aria-labelledby="total"
          className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5 md:p-6"
        >
          <h2 id="total" className="flex items-center gap-2 font-semibold">
            <Receipt aria-hidden className="size-4 text-forest" /> Total
          </h2>
          <dl className="flex flex-col gap-2 text-[0.9375rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Subtotal</dt>
              <dd className="tabular-nums">{money(order.subtotal)}</dd>
            </div>
            {order.discountTotal > 0 ? (
              <div className="flex justify-between gap-4 text-clay">
                <dt>{order.couponCode ? `Cod ${order.couponCode}` : "Reducere"}</dt>
                <dd className="tabular-nums">−{money(order.discountTotal)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <dt className="text-ink-muted">Livrare ({order.shippingMethodName})</dt>
              <dd className="tabular-nums">
                {order.shippingTotal > 0 ? money(order.shippingTotal) : "Gratuită"}
              </dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="text-xl font-semibold tabular-nums">{money(order.total)}</dd>
            </div>
          </dl>
          <p className="text-xs text-ink-muted">Prețurile includ TVA ({money(order.taxTotal)}).</p>
        </section>
        <section
          aria-label="Adrese"
          className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 md:p-6"
        >
          <AddressBlock title="Livrare" address={order.shippingAddress} />
          {sameBilling ? (
            <p className="text-sm text-ink-muted">Facturare la aceeași adresă.</p>
          ) : (
            <AddressBlock title="Facturare" address={order.billingAddress} />
          )}
          {order.customerNote ? (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold">Observații</h3>
              <p className="text-sm text-ink-muted">{order.customerNote}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section aria-labelledby="istoric" className="flex flex-col gap-4">
        <h2 id="istoric" className="font-display text-2xl">
          Istoric
        </h2>
        <ol className="flex flex-col gap-4 border-l border-line pl-6">
          {[...order.events].reverse().map((event) => (
            <li key={event.id} className="relative flex flex-col gap-0.5">
              <span
                aria-hidden
                className="absolute top-1 -left-[1.95rem] grid size-4 place-items-center rounded-full bg-surface text-forest"
              >
                {event.status === "DELIVERED" ? (
                  <Check className="size-4" />
                ) : (
                  <CircleDot className="size-4" />
                )}
              </span>
              <span className="font-semibold">
                {orderStatusLabels[event.status]}
                {event.paymentStatus === "PAID" && event.status === order.status && order.paidAt
                  ? " · plată confirmată"
                  : ""}
              </span>
              <time dateTime={event.createdAt.toISOString()} className="text-sm text-ink-muted">
                {orderDateTime.format(event.createdAt)}
              </time>
              {event.note ? <p className="text-sm text-ink-muted">{event.note}</p> : null}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
