import "server-only";

import type { PaymentMethod } from "@/generated/prisma/enums";
import type { SettingValue } from "@/validation/settings";

import {
  availablePaymentOptions as optionsFrom,
  createCardProvider,
  paymentProviders,
  providerFor as findProvider,
  type PaymentOption,
  type PaymentProvider,
} from "./methods";
import { netopiaConfig, startNetopiaPayment } from "./netopia-service";

/** Every payment provider, in display order: the offline ones, then card (NETOPIA). */
export function activePaymentProviders(): PaymentProvider[] {
  const netopia = netopiaConfig();
  return [
    ...paymentProviders,
    createCardProvider({
      ready: netopia !== null,
      testMode: netopia?.environment === "sandbox",
      start: (order) => startNetopiaPayment(order.id),
    }),
  ];
}

export function providerFor(method: PaymentMethod): PaymentProvider | null {
  return findProvider(method, activePaymentProviders());
}

export function availablePaymentOptions(settings: SettingValue<"payment">): PaymentOption[] {
  return optionsFrom(settings, activePaymentProviders());
}
