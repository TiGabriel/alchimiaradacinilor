/**
 * Payment methods — a small provider interface with the two offline methods the
 * shop starts with, and a factory for the card method (NETOPIA, wired up in
 * `registry.ts`). Nothing is ever simulated (see docs/PAYMENTS.md).
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
  | { kind: "redirect"; url: string }
  /** The processor could not be reached; the order exists and the customer can retry from it. */
  | { kind: "retry"; message: string };

export interface PaymentProvider {
  readonly method: PaymentMethod;
  /**
   * Online providers open a transaction with a processor in `start`, so it runs
   * once per payment attempt. Offline providers only describe what to do, and
   * `start` may be called again to show the instructions.
   */
  readonly online?: boolean;
  isAvailable(settings: PaymentSettings): boolean;
  option(settings: PaymentSettings): PaymentOption;
  start(
    order: { id: string; number: string; total: number; currency: string },
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

/**
 * Card payments through a processor's hosted page. Offered only when the
 * setting is on **and** the processor is fully configured (`ready`). In test
 * mode (sandbox credentials) the label says so, so nobody mistakes it for a
 * real payment.
 */
export function createCardProvider(deps: {
  ready: boolean;
  testMode: boolean;
  start: (order: { id: string }) => Promise<PaymentStart>;
}): PaymentProvider {
  return {
    method: "CARD",
    online: true,
    isAvailable: (s) => s.card.enabled && deps.ready,
    option: (s) => ({
      method: "CARD",
      label: deps.testMode ? `${s.card.label} (mediu de test)` : s.card.label,
      description: s.card.description,
    }),
    start: (order) => deps.start(order),
  };
}

/** The offline providers, in display order. The server registry (`registry.ts`) adds the card one. */
export const paymentProviders: PaymentProvider[] = [cashOnDeliveryProvider, bankTransferProvider];

export function providerFor(
  method: PaymentMethod,
  providers: PaymentProvider[] = paymentProviders,
): PaymentProvider | null {
  return providers.find((p) => p.method === method) ?? null;
}

export function availablePaymentOptions(
  settings: PaymentSettings,
  providers: PaymentProvider[] = paymentProviders,
): PaymentOption[] {
  return providers.filter((p) => p.isAvailable(settings)).map((p) => p.option(settings));
}
