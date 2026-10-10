import { describe, expect, it } from "vitest";

import { settingDefaults } from "@/validation/settings";

import {
  availablePaymentOptions,
  bankTransferProvider,
  bankTransferReady,
  createCardProvider,
  paymentProviders,
  providerFor,
} from "./methods";

const defaults = settingDefaults.payment;
const withBank = {
  ...defaults,
  bankTransfer: {
    ...defaults.bankTransfer,
    accountHolder: "Firma Exemplu SRL",
    iban: "RO00EXEM0000000000000000",
    bankName: "Banca Exemplu",
  },
};

describe("payment methods", () => {
  it("offers cash on delivery by default and never a card method", () => {
    expect(availablePaymentOptions(defaults).map((o) => o.method)).toEqual(["CASH_ON_DELIVERY"]);
    expect(providerFor("CARD")).toBeNull();
  });

  it("offers bank transfer only once the account details are configured", () => {
    expect(bankTransferReady(defaults)).toBe(false);
    expect(bankTransferReady(withBank)).toBe(true);
    expect(
      bankTransferReady({
        ...withBank,
        bankTransfer: { ...withBank.bankTransfer, enabled: false },
      }),
    ).toBe(false);
    expect(availablePaymentOptions(withBank).map((o) => o.method)).toEqual([
      "CASH_ON_DELIVERY",
      "BANK_TRANSFER",
    ]);
  });

  it("gives bank transfer instructions with the order number as reference", async () => {
    const start = await bankTransferProvider.start(
      { id: "o1", number: "AR-2026-000007", total: 12345, currency: "RON" },
      withBank,
    );
    expect(start.kind).toBe("offline");
    const text = start.kind === "offline" ? start.instructions.join("\n") : "";
    expect(text).toContain("RO00EXEM0000000000000000");
    expect(text).toContain("AR-2026-000007");
    expect(text).toContain("123,45");
  });

  describe("card provider", () => {
    const start = async () => ({ kind: "redirect" as const, url: "https://pay.example/x" });
    const withCard = { ...defaults, card: { ...defaults.card, enabled: true } };

    it("is off by default (setting) and without credentials", () => {
      expect(defaults.card.enabled).toBe(false);
      const ready = createCardProvider({ ready: true, testMode: false, start });
      const notReady = createCardProvider({ ready: false, testMode: false, start });
      expect(availablePaymentOptions(defaults, [...paymentProviders, ready])).toHaveLength(1);
      expect(availablePaymentOptions(withCard, [...paymentProviders, notReady])).toHaveLength(1);
    });

    it("is offered next to cash on delivery once enabled and configured", () => {
      const card = createCardProvider({ ready: true, testMode: false, start });
      expect(
        availablePaymentOptions(withCard, [...paymentProviders, card]).map((o) => o.method),
      ).toEqual(["CASH_ON_DELIVERY", "CARD"]);
      expect(card.online).toBe(true);
    });

    it("labels sandbox payments as a test environment", () => {
      const card = createCardProvider({ ready: true, testMode: true, start });
      expect(card.option(withCard).label).toContain("mediu de test");
    });
  });
});
