import { describe, expect, it } from "vitest";

import {
  changePasswordSchema,
  fieldErrors,
  loginSchema,
  profileSchema,
  registerSchema,
  safeNextPath,
} from "./auth";

const valid = {
  firstName: "Ana-Maria",
  lastName: "Ionescu",
  email: "  Ana.Ionescu@Example.RO ",
  password: "lavanda2026",
  confirmPassword: "lavanda2026",
  privacyConsent: "on",
};

describe("registerSchema", () => {
  it("accepts a valid registration and normalises the email", () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe("ana.ionescu@example.ro");
    expect(parsed.privacyConsent).toBe(true);
  });

  it("keeps marketing consent off unless explicitly checked", () => {
    expect(registerSchema.parse(valid).marketingConsent).toBe(false);
    expect(registerSchema.parse({ ...valid, marketingConsent: "on" }).marketingConsent).toBe(true);
    expect(registerSchema.parse({ ...valid, marketingConsent: "yes" }).marketingConsent).toBe(
      false,
    );
  });

  it("requires the privacy consent", () => {
    const result = registerSchema.safeParse({ ...valid, privacyConsent: undefined });
    expect(result.success).toBe(false);
    expect(fieldErrors(result.error!).privacyConsent).toMatch(/Politicii de confidențialitate/);
  });

  it("rejects mismatched passwords and weak passwords", () => {
    const mismatch = registerSchema.safeParse({ ...valid, confirmPassword: "altceva2026" });
    expect(fieldErrors(mismatch.error!).confirmPassword).toBe("Parolele nu coincid.");
    const weak = registerSchema.safeParse({
      ...valid,
      password: "scurta1",
      confirmPassword: "scurta1",
    });
    expect(fieldErrors(weak.error!).password).toMatch(/10 caractere/);
    const noDigit = registerSchema.safeParse({
      ...valid,
      password: "doarlitereaici",
      confirmPassword: "doarlitereaici",
    });
    expect(fieldErrors(noDigit.error!).password).toMatch(/cifră/);
  });

  it("accepts Romanian diacritics in names and rejects digits", () => {
    expect(
      registerSchema.safeParse({ ...valid, firstName: "Ștefania", lastName: "Țăranu" }).success,
    ).toBe(true);
    expect(registerSchema.safeParse({ ...valid, firstName: "Ana2" }).success).toBe(false);
  });

  it("rejects invalid emails", () => {
    expect(registerSchema.safeParse({ ...valid, email: "ana@" }).success).toBe(false);
  });
});

describe("loginSchema / changePasswordSchema", () => {
  it("normalises login email", () => {
    expect(loginSchema.parse({ email: "A@B.RO", password: "x" }).email).toBe("a@b.ro");
  });

  it("requires a different new password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "lavanda2026",
      password: "lavanda2026",
      confirmPassword: "lavanda2026",
    });
    expect(fieldErrors(result.error!).password).toMatch(/diferită/);
  });
});

describe("profileSchema", () => {
  it("normalises Romanian mobile numbers and allows none", () => {
    expect(
      profileSchema.parse({ firstName: "Ana", lastName: "Pop", phone: "0722 123 456" }).phone,
    ).toBe("0722123456");
    expect(profileSchema.parse({ firstName: "Ana", lastName: "Pop", phone: "" }).phone).toBeNull();
    expect(
      profileSchema.safeParse({ firstName: "Ana", lastName: "Pop", phone: "123" }).success,
    ).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("only allows same-site relative paths", () => {
    expect(safeNextPath("/cont/adrese")).toBe("/cont/adrese");
    expect(safeNextPath("https://evil.example")).toBe("/cont");
    expect(safeNextPath("//evil.example")).toBe("/cont");
    expect(safeNextPath("/\\evil.example")).toBe("/cont");
    expect(safeNextPath(undefined, "/")).toBe("/");
  });
});
