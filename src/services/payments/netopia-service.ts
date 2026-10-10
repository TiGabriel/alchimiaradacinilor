import "server-only";

import { randomBytes } from "node:crypto";

import type { PaymentStatus } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { getSettings } from "@/services/settings";

import type { PaymentStart } from "./methods";
import {
  amountMatches,
  buildStartRequest,
  classifyNetopiaStatus,
  ipnReply,
  NETOPIA_API_URLS,
  netopiaOrderId,
  orderNumberFromNetopiaId,
  parseStartResponse,
  readNetopiaConfig,
  verifyNetopiaIpn,
  type NetopiaConfig,
} from "./netopia";

export const NETOPIA = "netopia";

export function netopiaConfig(): NetopiaConfig | null {
  return readNetopiaConfig(env());
}

export class PaymentStartError extends Error {}

/**
 * Opens a NETOPIA payment for a stored card order and returns the hosted page
 * to redirect to. The amount is the order's stored total (computed on the
 * server at checkout). Each call is a new attempt with its own NETOPIA order id.
 */
export async function startNetopiaPayment(orderId: string): Promise<PaymentStart> {
  const config = netopiaConfig();
  if (!config) throw new PaymentStartError("NETOPIA nu este configurat.");
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { items: { orderBy: { id: "asc" } }, addresses: true },
  });
  if (order.paymentMethod !== "CARD")
    throw new PaymentStartError("Comanda nu este plătibilă cu cardul.");
  if (order.paymentStatus === "PAID") throw new PaymentStartError("Comanda este deja achitată.");
  const shipping = order.addresses.find((a) => a.type === "SHIPPING");
  const billing = order.addresses.find((a) => a.type === "BILLING") ?? shipping;
  if (!shipping || !billing) throw new PaymentStartError("Comanda nu are adresă.");

  const settings = await getSettings();
  const body = buildStartRequest({
    config,
    order: { ...order, billing, shipping },
    orderId: netopiaOrderId(order.number, randomBytes(4).toString("hex")),
    vatRatePercent: settings.tax.vatRatePercent,
    siteName: settings.brand.siteName,
  });

  let outcome;
  try {
    const res = await fetch(`${NETOPIA_API_URLS[config.environment]}/payment/card/start`, {
      method: "POST",
      headers: { Authorization: config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Short enough to answer within a serverless request; a timeout falls back to "retry".
      signal: AbortSignal.timeout(8_000),
    });
    outcome = parseStartResponse(res.status, await res.json().catch(() => null));
  } catch (error) {
    outcome = { ok: false as const, error: error instanceof Error ? error.message : String(error) };
  }
  if (!outcome.ok) {
    console.error(`[payments] NETOPIA start failed for ${order.number}:`, outcome.error);
    throw new PaymentStartError("Plata cu cardul nu a putut fi inițiată.");
  }

  await db.order.update({
    where: { id: order.id },
    data: { paymentProvider: NETOPIA, paymentReference: outcome.ntpId ?? order.paymentReference },
  });
  return { kind: "redirect", url: outcome.paymentUrl };
}

// ── IPN ────────────────────────────────────────────────────────────────────

const CUSTOMER_NOTES: Partial<Record<PaymentStatus, string>> = {
  PAID: "Plata cu cardul a fost confirmată de NETOPIA Payments.",
  FAILED: "Plata cu cardul nu a fost finalizată. Poți încerca din nou din pagina comenzii.",
  REFUNDED: "Plata cu cardul a fost rambursată.",
};

const TEST_NOTE = " Plată de test (sandbox NETOPIA) — nu este o plată reală.";

/**
 * Handles one NETOPIA notification. The order's payment status changes only
 * after the signature, POS, payload hash, order and amount all check out, and
 * only forward: a duplicate or late notification never undoes a recorded
 * payment. Returns the JSON body NETOPIA expects.
 */
export async function handleNetopiaIpn(token: string | null, rawBody: Buffer) {
  const config = netopiaConfig();
  if (!config) return ipnReply("permanent", "card payments are not configured");

  const verified = verifyNetopiaIpn({
    token,
    rawBody,
    publicKey: config.publicKey,
    posSignature: config.posSignature,
  });
  if (!verified.ok) {
    console.warn("[payments] NETOPIA IPN rejected:", verified.error);
    return ipnReply("permanent", verified.error);
  }

  const { payment, order: ipnOrder } = verified.payload;
  const number = orderNumberFromNetopiaId(ipnOrder.orderID);
  if (!number) return ipnReply("permanent", "unknown order");
  const outcome = classifyNetopiaStatus(payment.status);
  if (outcome === "pending") return ipnReply("ok");

  try {
    const result = await db.$transaction(async (tx) => {
      const [row] = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM orders WHERE number = ${number} AND "paymentMethod" = 'CARD' FOR UPDATE`;
      if (!row) return "unknown-order" as const;
      const order = await tx.order.findUniqueOrThrow({
        where: { id: row.id },
        select: { id: true, status: true, paymentStatus: true, total: true, currency: true },
      });

      let next: PaymentStatus | null = null;
      if (outcome === "paid" && order.paymentStatus !== "PAID") {
        if (!amountMatches(payment, order)) return "amount-mismatch" as const;
        next = "PAID";
      } else if (outcome === "failed" && order.paymentStatus === "UNPAID") {
        // A later failed attempt never overrides a successful one.
        next = "FAILED";
      } else if (outcome === "refunded" && order.paymentStatus === "PAID") {
        next = "REFUNDED";
      }
      if (!next) return "unchanged" as const;

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: next,
          paymentProvider: NETOPIA,
          ...(payment.ntpID ? { paymentReference: payment.ntpID } : {}),
          ...(next === "PAID" ? { paidAt: new Date() } : {}),
        },
      });
      await tx.orderStatusEvent.create({
        data: {
          orderId: order.id,
          status: order.status,
          paymentStatus: next,
          note: `${CUSTOMER_NOTES[next] ?? ""}${config.environment === "sandbox" ? TEST_NOTE : ""}`.trim(),
        },
      });
      if (next === "PAID" && ["CANCELLED", "REFUNDED"].includes(order.status))
        console.error(
          `[payments] ${number} was paid by card after being ${order.status}: refund it from NETOPIA's dashboard.`,
        );
      return next;
    });

    if (result === "unknown-order") return ipnReply("permanent", "unknown order");
    if (result === "amount-mismatch") {
      console.error(
        `[payments] NETOPIA amount mismatch for ${number}: ${payment.amount} ${payment.currency}. Not marked as paid.`,
      );
      return ipnReply("permanent", "amount mismatch");
    }
    return ipnReply("ok");
  } catch (error) {
    console.error("[payments] NETOPIA IPN failed", error);
    return ipnReply("temporary", "temporary error, retry later");
  }
}

// ── Retry ──────────────────────────────────────────────────────────────────

/** A customer's own unpaid card order that can be paid again, or null. */
export async function payableCardOrder(userId: string, number: string) {
  const order = await db.order.findFirst({
    where: { number, userId, paymentMethod: "CARD" },
    select: { id: true, status: true, paymentStatus: true },
  });
  if (!order) return null;
  if (!["UNPAID", "FAILED"].includes(order.paymentStatus)) return null;
  if (["CANCELLED", "REFUNDED"].includes(order.status)) return null;
  return order;
}
