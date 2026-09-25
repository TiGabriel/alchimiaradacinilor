import { describe, expect, it } from "vitest";

import { checkoutSchema } from "./checkout";

/** Exactly what the checkout form submits: raw strings, empty optional fields. */
const clientPayload = {
  shipping: {
    kind: "new",
    save: true,
    address: {
      firstName: "Ana",
      lastName: "Pop",
      phone: "0722 123 456",
      street: "Str. Florilor 12",
      streetExtra: "",
      city: "Cluj-Napoca",
      county: "Cluj",
      postalCode: "400001",
      companyName: "",
      vatNumber: "",
      tradeRegisterNo: "",
    },
  },
  billing: { kind: "same" },
  shippingMethod: "curier",
  paymentMethod: "CASH_ON_DELIVERY",
  note: "",
  acceptTerms: true,
  expectedTotal: 14419,
};

describe("checkoutSchema", () => {
  it("accepts the raw form payload and normalises it", () => {
    const parsed = checkoutSchema.parse(clientPayload);
    expect(parsed.shipping).toMatchObject({
      kind: "new",
      address: { phone: "0722123456", vatNumber: null, streetExtra: null },
    });
    expect(parsed.note).toBeNull();
  });

  it("requires accepting the terms", () => {
    const result = checkoutSchema.safeParse({ ...clientPayload, acceptTerms: false });
    expect(result.success).toBe(false);
  });

  it("never accepts prices, only the displayed total", () => {
    const parsed = checkoutSchema.parse({ ...clientPayload, subtotal: 1, items: [{ price: 1 }] });
    expect(parsed).not.toHaveProperty("subtotal");
    expect(parsed).not.toHaveProperty("items");
    expect(checkoutSchema.safeParse({ ...clientPayload, expectedTotal: -1 }).success).toBe(false);
  });

  it("rejects unknown payment methods and malformed address ids", () => {
    expect(checkoutSchema.safeParse({ ...clientPayload, paymentMethod: "CRYPTO" }).success).toBe(
      false,
    );
    expect(
      checkoutSchema.safeParse({
        ...clientPayload,
        shipping: { kind: "saved", addressId: "1 OR 1=1" },
      }).success,
    ).toBe(false);
  });
});
