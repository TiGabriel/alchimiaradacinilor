import { describe, expect, it } from "vitest";

import { addressSchema, COUNTIES } from "./address";

const valid = {
  firstName: "Ana",
  lastName: "Pop",
  phone: "0722 123 456",
  street: "Str. Florilor nr. 3",
  city: "Cluj-Napoca",
  county: "Cluj",
  postalCode: "400001",
};

describe("addressSchema", () => {
  it("accepts a Romanian address and normalises optional fields", () => {
    const parsed = addressSchema.parse({ ...valid, label: "", vatNumber: " ro 123456 " });
    expect(parsed.phone).toBe("0722123456");
    expect(parsed.label).toBeNull();
    expect(parsed.vatNumber).toBe("RO123456");
    expect(parsed.isDefaultShipping).toBe(false);
  });

  it("validates county, postal code and phone", () => {
    expect(addressSchema.safeParse({ ...valid, county: "Atlantis" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, postalCode: "4000" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, phone: "12345" }).success).toBe(false);
  });

  it("lists all 41 counties plus Bucharest", () => {
    expect(COUNTIES).toHaveLength(42);
  });
});
