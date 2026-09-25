/** Order status rules and labels — pure and unit-tested. */
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";

export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: "Înregistrată",
  CONFIRMED: "Confirmată",
  PROCESSING: "În pregătire",
  SHIPPED: "Expediată",
  DELIVERED: "Livrată",
  CANCELLED: "Anulată",
  REFUNDED: "Rambursată",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Neachitată",
  PAID: "Achitată",
  FAILED: "Plată eșuată",
  REFUNDED: "Rambursată",
  PARTIALLY_REFUNDED: "Rambursată parțial",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Plată la livrare",
  BANK_TRANSFER: "Transfer bancar",
  CARD: "Card online",
};

/** One-line explanation shown to the customer for each status. */
export const orderStatusDescriptions: Record<OrderStatus, string> = {
  PENDING: "Am primit comanda ta și o verificăm.",
  CONFIRMED: "Comanda ta a fost confirmată.",
  PROCESSING: "Pregătim coletul tău cu grijă.",
  SHIPPED: "Coletul tău este pe drum.",
  DELIVERED: "Comanda a fost livrată. Sperăm să te bucuri de ea!",
  CANCELLED: "Comanda a fost anulată.",
  REFUNDED: "Suma plătită a fost rambursată.",
};

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "PROCESSING", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "SHIPPED", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function allowedTransitions(from: OrderStatus): OrderStatus[] {
  return transitions[from];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

/** Cancelling an order that has not left the warehouse returns its items to stock. */
export function restocksOn(from: OrderStatus, to: OrderStatus): boolean {
  return to === "CANCELLED" && ["PENDING", "CONFIRMED", "PROCESSING"].includes(from);
}

/** Customer-visible progress steps (cancelled/refunded orders show their own state instead). */
export const ORDER_PROGRESS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

/** Human-friendly order number: AR-2026-000123. */
export function formatOrderNumber(year: number, sequence: number, prefix = "AR"): string {
  return `${prefix}-${year}-${String(sequence).padStart(6, "0")}`;
}

/** Order numbers are parsed from URLs; only this exact shape is looked up. */
export const ORDER_NUMBER_PATTERN = /^[A-Z]{2}-\d{4}-\d{6,}$/;
