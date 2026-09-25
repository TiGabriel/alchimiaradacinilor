import { describe, expect, it } from "vitest";

import { settingDefaults } from "@/validation/settings";

import {
  availablePaymentOptions,
  bankTransferProvider,
  bankTransferReady,
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
      { number: "AR-2026-000007", total: 12345, currency: "RON" },
      withBank,
    );
    expect(start.kind).toBe("offline");
    const text = start.kind === "offline" ? start.instructions.join("\n") : "";
    expect(text).toContain("RO00EXEM0000000000000000");
    expect(text).toContain("AR-2026-000007");
    expect(text).toContain("123,45");
  });
});
