import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusForm } from "@/features/admin/orders/status-form";
import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { OrderStatusBadge } from "@/features/orders/order-detail";
import { emailConfigured } from "@/lib/email";
import { formatMoney } from "@/lib/money";
import { getAdminOrder } from "@/services/admin/orders";
import { formatAddressLines } from "@/services/orders/format";
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
} from "@/services/orders/status";

export const metadata: Metadata = { title: "Comandă" };

const dateTime = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Bucharest",
});

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { user } = await requirePermission("orders:manage");
  const order = await getAdminOrder({ id: user.id, roles: user.roles }, id);
  if (!order) notFound();
  const money = (v: number) => formatMoney(v, order.currency);

  return (
    <>
      <AdminPageHeader
        title={`Comanda ${order.number}`}
        description={
          <>
            Plasată pe {dateTime.format(order.placedAt)} ·{" "}
            <OrderStatusBadge status={order.status} />
          </>
        }
        back={{ href: "/admin/comenzi", label: "Comenzi" }}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <AdminCard title="Produse">
            <ul className="flex flex-col divide-y divide-line text-sm">
              {order.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex flex-col">
                    {i.productId ? (
                      <Link
                        href={`/admin/produse/${i.productId}`}
                        className="font-semibold hover:text-forest"
                      >
                        {i.productName}
                      </Link>
                    ) : (
                      <span className="font-semibold">{i.productName}</span>
                    )}
                    <span className="font-mono text-xs text-ink-muted">{i.sku}</span>
                  </span>
                  <span className="text-ink-muted tabular-nums">
                    {i.quantity} × {money(i.unitPrice)}
                  </span>
                  <span className="font-semibold tabular-nums">
                    {money(i.quantity * i.unitPrice)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="flex flex-col gap-1.5 border-t border-line pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="tabular-nums">{money(order.subtotal)}</dd>
              </div>
              {order.discountTotal > 0 ? (
                <div className="flex justify-between text-clay">
                  <dt>{order.couponCode ? `Cod ${order.couponCode}` : "Reducere"}</dt>
                  <dd className="tabular-nums">−{money(order.discountTotal)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-ink-muted">Livrare ({order.shippingMethodName})</dt>
                <dd className="tabular-nums">
                  {order.shippingTotal ? money(order.shippingTotal) : "Gratuită"}
                </dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{money(order.total)}</dd>
              </div>
              <div className="flex justify-between text-xs text-ink-muted">
                <dt>din care TVA</dt>
                <dd className="tabular-nums">{money(order.taxTotal)}</dd>
              </div>
            </dl>
          </AdminCard>
          <div className="grid gap-6 md:grid-cols-2">
            {[
              ["Livrare", order.shippingAddress],
              ["Facturare", order.billingAddress],
            ].map(([title, a]) =>
              a && typeof a === "object" ? (
                <AdminCard key={title as string} title={title as string}>
                  <address className="text-sm leading-relaxed not-italic">
                    {formatAddressLines(a).map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </AdminCard>
              ) : null,
            )}
          </div>
          {order.customerNote ? (
            <AdminCard title="Observațiile clientului">
              <p className="text-sm whitespace-pre-line">{order.customerNote}</p>
            </AdminCard>
          ) : null}
          <AdminCard title="Istoric">
            <ol className="flex flex-col gap-3 text-sm">
              {order.events.map((e) => (
                <li key={e.id} className="flex flex-col gap-0.5 border-l-2 border-line pl-3">
                  <span className="font-semibold">
                    {orderStatusLabels[e.status]}
                    {e.paymentStatus ? ` · ${paymentStatusLabels[e.paymentStatus]}` : ""}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {dateTime.format(e.createdAt)} ·{" "}
                    {e.actor ? `${e.actor.firstName} ${e.actor.lastName}` : "client / sistem"}
                    {e.notifiedAt ? " · client anunțat" : ""}
                  </span>
                  {e.note ? <span className="text-ink-muted">{e.note}</span> : null}
                </li>
              ))}
            </ol>
          </AdminCard>
        </div>
        <div className="flex flex-col gap-6">
          <AdminCard title="Stare">
            <OrderStatusForm
              orderId={order.id}
              nextStatuses={order.nextStatuses}
              emailEnabled={emailConfigured()}
              canMarkPaid={
                order.paymentStatus !== "PAID" &&
                order.status !== "CANCELLED" &&
                order.status !== "REFUNDED"
              }
            />
          </AdminCard>
          <AdminCard title="Client">
            <p className="text-sm">
              {order.user ? (
                <Link
                  href={`/admin/clienti/${order.user.id}`}
                  className="font-semibold hover:text-forest"
                >
                  {order.user.firstName} {order.user.lastName}
                </Link>
              ) : (
                "Cont șters"
              )}
              <br />
              <span className="text-ink-muted">{order.email}</span>
              {order.phone ? (
                <>
                  <br />
                  <span className="text-ink-muted">{order.phone}</span>
                </>
              ) : null}
            </p>
            <p className="text-sm">
              Plată: {paymentMethodLabels[order.paymentMethod]} ·{" "}
              {paymentStatusLabels[order.paymentStatus]}
            </p>
            <p className="text-xs text-ink-muted">
              Termeni acceptați (versiunea {order.termsVersion}) la plasarea comenzii.
            </p>
          </AdminCard>
        </div>
      </div>
    </>
  );
}
