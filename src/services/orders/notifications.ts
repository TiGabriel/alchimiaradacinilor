import "server-only";

import { emailConfigured, isDelivered } from "@/lib/email";
import { emailBrand, sendShopEmail } from "@/services/email";
import { orderConfirmationEmail, orderStatusEmail } from "@/lib/email/templates/orders";

import { db } from "@/lib/db";

import type { PaymentStart } from "../payments/methods";

import { formatAddressLines } from "./format";
import { orderStatusDescriptions, orderStatusLabels, paymentMethodLabels } from "./status";

const brand = emailBrand;

/** Order confirmation — only when an email provider is configured; never faked. */
export async function sendOrderConfirmation(orderId: string, payment: PaymentStart) {
  if (!emailConfigured()) return false;
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      items: true,
      addresses: { where: { type: "SHIPPING" } },
      user: { select: { firstName: true } },
    },
  });
  const b = await brand();
  const address = order.addresses[0];
  const result = await sendShopEmail({
    to: order.email,
    ...orderConfirmationEmail(
      {
        number: order.number,
        firstName: order.user?.firstName ?? address?.firstName ?? "",
        url: `${b.siteUrl}/cont/comenzi/${order.number}`,
        items: order.items.map((i) => ({
          name: i.productName,
          quantity: i.quantity,
          lineTotal: i.unitPrice * i.quantity,
        })),
        subtotal: order.subtotal,
        discount: order.discountTotal,
        discountLabel: order.couponCode ? `Cod ${order.couponCode}` : null,
        shipping: order.shippingTotal,
        shippingMethodName: order.shippingMethodName,
        total: order.total,
        tax: order.taxTotal,
        currency: order.currency,
        paymentLabel: paymentMethodLabels[order.paymentMethod],
        paymentInstructions: payment.kind === "offline" ? payment.instructions : [],
        shippingAddress: address ? formatAddressLines(address) : [],
      },
      b,
    ),
  });
  return isDelivered(result);
}

/** Status update email for one status event; records `notifiedAt` when delivered. */
export async function sendOrderStatusEmail(eventId: string) {
  if (!emailConfigured()) return false;
  const event = await db.orderStatusEvent.findUniqueOrThrow({
    where: { id: eventId },
    include: {
      order: {
        select: {
          number: true,
          email: true,
          user: { select: { firstName: true } },
          addresses: { where: { type: "SHIPPING" }, select: { firstName: true } },
        },
      },
    },
  });
  const b = await brand();
  const result = await sendShopEmail({
    to: event.order.email,
    ...orderStatusEmail(
      {
        number: event.order.number,
        firstName: event.order.user?.firstName ?? event.order.addresses[0]?.firstName ?? "",
        url: `${b.siteUrl}/cont/comenzi/${event.order.number}`,
        statusLabel: orderStatusLabels[event.status],
        message: orderStatusDescriptions[event.status],
        note: event.note,
      },
      b,
    ),
  });
  const delivered = isDelivered(result);
  if (delivered)
    await db.orderStatusEvent.update({ where: { id: eventId }, data: { notifiedAt: new Date() } });
  return delivered;
}
