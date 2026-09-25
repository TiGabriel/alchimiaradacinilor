/**
 * Payment methods — a small provider interface with the two offline methods the
 * shop starts with. Card payments are added by implementing `PaymentProvider`
 * for Stripe or Netopia (see docs/PAYMENTS.md); nothing is ever simulated.
 * Pure and unit-tested.
 */
import type { PaymentMethod } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/money";
import type { SettingValue } from "@/validation/settings";

type PaymentSettings = SettingValue<"payment">;

export type PaymentOption = { method: PaymentMethod; label: string; description: string };

/** What happens right after an order is placed. */
export type PaymentStart =
  /** Nothing to do online; the customer sees these instructions. */
  | { kind: "offline"; instructions: string[] }
  /** Hosted payment page (card providers). */
  | { kind: "redirect"; url: string };

export interface PaymentProvider {
  readonly method: PaymentMethod;
  isAvailable(settings: PaymentSettings): boolean;
  option(settings: PaymentSettings): PaymentOption;
  start(
    order: { number: string; total: number; currency: string },
    settings: PaymentSettings,
  ): Promise<PaymentStart> | PaymentStart;
}

export function bankTransferReady(settings: PaymentSettings): boolean {
  const bank = settings.bankTransfer;
  return bank.enabled && Boolean(bank.iban?.trim()) && Boolean(bank.accountHolder?.trim());
}

export const cashOnDeliveryProvider: PaymentProvider = {
  method: "CASH_ON_DELIVERY",
  isAvailable: (s) => s.cashOnDelivery.enabled,
  option: (s) => ({
    method: "CASH_ON_DELIVERY",
    label: s.cashOnDelivery.label,
    description: s.cashOnDelivery.description,
  }),
  start: (order) => ({
    kind: "offline",
    instructions: [`Vei plăti ${formatMoney(order.total, order.currency)} la primirea coletului.`],
  }),
};

export const bankTransferProvider: PaymentProvider = {
  method: "BANK_TRANSFER",
  isAvailable: bankTransferReady,
  option: (s) => ({
    method: "BANK_TRANSFER",
    label: s.bankTransfer.label,
    description: s.bankTransfer.description,
  }),
  start: (order, s) => {
    const bank = s.bankTransfer;
    return {
      kind: "offline",
      instructions: [
        `Suma de plată: ${formatMoney(order.total, order.currency)}`,
        `Beneficiar: ${bank.accountHolder}`,
        `IBAN: ${bank.iban}`,
        ...(bank.bankName ? [`Banca: ${bank.bankName}`] : []),
        `Detalii plată: comanda ${order.number}`,
        `Păstrăm comanda ${bank.paymentTermDays} zile și o expediem după ce primim plata.`,
      ],
    };
  },
};

/** Registered providers, in display order. Add card providers here. */
export const paymentProviders: PaymentProvider[] = [cashOnDeliveryProvider, bankTransferProvider];

export function providerFor(method: PaymentMethod): PaymentProvider | null {
  return paymentProviders.find((p) => p.method === method) ?? null;
}

export function availablePaymentOptions(settings: PaymentSettings): PaymentOption[] {
  return paymentProviders.filter((p) => p.isAvailable(settings)).map((p) => p.option(settings));
}
