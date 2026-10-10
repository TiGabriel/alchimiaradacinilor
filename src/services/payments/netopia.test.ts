import { createHash, generateKeyPairSync, sign } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  amountMatches,
  buildStartRequest,
  classifyNetopiaStatus,
  ipnReply,
  NETOPIA_API_URLS,
  netopiaOrderId,
  normalisePem,
  orderNumberFromNetopiaId,
  parseStartResponse,
  readNetopiaConfig,
  toNetopiaAmount,
  verifyNetopiaIpn,
  type NetopiaConfig,
} from "./netopia";

// Test-only key pair, generated per run (stands in for NETOPIA's signing key).
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const publicPem = publicKey.export({ type: "spki", format: "pem" }).toString();
const POS = "TEST-POS-SIGNATURE";
const NOW = Date.UTC(2026, 9, 10, 12, 0, 0);

const b64url = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

function token(
  body: string,
  overrides: {
    claims?: Record<string, unknown>;
    header?: Record<string, unknown>;
    key?: typeof privateKey;
  } = {},
) {
  const header = b64url({ typ: "JWT", alg: "RS512", ...overrides.header });
  const claims = b64url({
    iss: "NETOPIA Payments",
    aud: [POS],
    iat: NOW,
    exp: NOW + 60_000,
    sub: createHash("sha512").update(body).digest("base64"),
    ...overrides.claims,
  });
  const signature = sign("sha512", Buffer.from(`${header}.${claims}`), overrides.key ?? privateKey);
  return `${header}.${claims}.${signature.toString("base64url")}`;
}

const ipnBody = JSON.stringify({
  payment: { method: "card", ntpID: "1234567", status: 3, amount: 123.45, currency: "RON" },
  order: { orderID: "AR-2026-000042_a1b2c3d4" },
});

function check(tokenValue: string | null, body = ipnBody, publicKeyPem = publicPem) {
  return verifyNetopiaIpn({
    token: tokenValue,
    rawBody: Buffer.from(body),
    publicKey: publicKeyPem,
    posSignature: POS,
    now: NOW,
  });
}

describe("readNetopiaConfig", () => {
  const full = {
    NETOPIA_ENV: "sandbox" as const,
    NETOPIA_API_KEY: "key",
    NETOPIA_POS_SIGNATURE: POS,
    NETOPIA_PUBLIC_KEY: "-----BEGIN PUBLIC KEY-----\\nabc\\n-----END PUBLIC KEY-----",
    APP_URL: "https://example.ro/",
  };

  it("needs every credential and an explicit environment", () => {
    expect(readNetopiaConfig(full)).toMatchObject({
      environment: "sandbox",
      appUrl: "https://example.ro",
    });
    expect(readNetopiaConfig({ ...full, NETOPIA_ENV: undefined })).toBeNull();
    expect(readNetopiaConfig({ ...full, NETOPIA_API_KEY: " " })).toBeNull();
    expect(readNetopiaConfig({ ...full, NETOPIA_PUBLIC_KEY: undefined })).toBeNull();
  });

  it("accepts a PEM with escaped newlines", () => {
    expect(normalisePem(full.NETOPIA_PUBLIC_KEY)).toBe(
      "-----BEGIN PUBLIC KEY-----\nabc\n-----END PUBLIC KEY-----",
    );
  });

  it("keeps sandbox and live endpoints apart", () => {
    expect(NETOPIA_API_URLS.sandbox).toContain("sandbox");
    expect(NETOPIA_API_URLS.live).not.toContain("sandbox");
  });
});

describe("order ids and amounts", () => {
  it("gives every attempt its own id and maps it back to the order number", () => {
    const id = netopiaOrderId("AR-2026-000042", "a1b2c3d4");
    expect(id).toBe("AR-2026-000042_a1b2c3d4");
    expect(orderNumberFromNetopiaId(id)).toBe("AR-2026-000042");
    expect(orderNumberFromNetopiaId("AR-2026-000042")).toBe("AR-2026-000042");
    expect(orderNumberFromNetopiaId("'; DROP TABLE orders;--_x")).toBeNull();
  });

  it("converts bani to the decimal amount exactly", () => {
    expect(toNetopiaAmount(12345)).toBe(123.45);
    expect(toNetopiaAmount(1999)).toBe(19.99);
    expect(() => toNetopiaAmount(1.5)).toThrow();
  });

  it("matches the notified amount against the stored total", () => {
    expect(
      amountMatches({ amount: 123.45, currency: "RON" }, { total: 12345, currency: "RON" }),
    ).toBe(true);
    expect(
      amountMatches({ amount: 0.1 + 0.2, currency: "ron" }, { total: 30, currency: "RON" }),
    ).toBe(true);
    expect(amountMatches({ amount: 1.0, currency: "RON" }, { total: 12345, currency: "RON" })).toBe(
      false,
    );
    expect(
      amountMatches({ amount: 123.45, currency: "EUR" }, { total: 12345, currency: "RON" }),
    ).toBe(false);
  });
});

describe("buildStartRequest", () => {
  const config: NetopiaConfig = {
    environment: "sandbox",
    apiKey: "key",
    posSignature: POS,
    publicKey: publicPem,
    appUrl: "https://example.ro",
  };
  const address = {
    firstName: "Ana",
    lastName: "Pop",
    phone: "0712345678",
    street: "Str. Teilor 1",
    streetExtra: "Ap. 2",
    city: "Cluj-Napoca",
    county: "Cluj",
    postalCode: "400000",
  };
  const body = buildStartRequest({
    config,
    orderId: "AR-2026-000042_a1b2c3d4",
    vatRatePercent: 21,
    siteName: "Alchimia Rădăcinilor",
    order: {
      number: "AR-2026-000042",
      total: 12345,
      currency: "RON",
      email: "ana@example.ro",
      placedAt: new Date(NOW),
      items: [{ productName: "Lavandă", sku: "LAV-15", unitPrice: 5000, quantity: 2 }],
      billing: address,
      shipping: address,
    },
  });

  it("charges the stored order total", () => {
    expect(body.order.amount).toBe(123.45);
    expect(body.order.currency).toBe("RON");
    expect(body.order.orderID).toBe("AR-2026-000042_a1b2c3d4");
    expect(body.order.posSignature).toBe(POS);
  });

  it("never carries card data: the customer pays on NETOPIA's page", () => {
    expect(body.payment.instrument).toEqual({ type: "card" });
    expect(JSON.stringify(body)).not.toMatch(/account|secretCode|expMonth/);
  });

  it("points notifications to the IPN and the customer back to the order", () => {
    expect(body.config.notifyUrl).toBe("https://example.ro/api/plati/netopia/ipn");
    expect(body.config.redirectUrl).toBe(
      "https://example.ro/api/plati/netopia/retur?comanda=AR-2026-000042",
    );
    expect(body.order.billing).toMatchObject({
      country: 642,
      state: "Cluj",
      details: "Str. Teilor 1, Ap. 2",
    });
  });
});

describe("parseStartResponse", () => {
  it("returns the hosted payment page", () => {
    expect(
      parseStartResponse(200, {
        payment: {
          ntpID: 1310396,
          status: 1,
          paymentURL: "https://secure.sandbox.netopia-payments.com/ui/card?p=x",
        },
        error: { code: "101", message: "Redirect user to payment page" },
      }),
    ).toEqual({
      ok: true,
      paymentUrl: "https://secure.sandbox.netopia-payments.com/ui/card?p=x",
      ntpId: "1310396",
    });
  });

  it("reports errors and refuses non-https pages", () => {
    expect(parseStartResponse(401, { code: 401, message: "Unauthorized" })).toMatchObject({
      ok: false,
    });
    expect(
      parseStartResponse(200, { payment: { paymentURL: "http://evil.example" } }),
    ).toMatchObject({ ok: false });
    expect(parseStartResponse(500, null)).toMatchObject({ ok: false });
  });
});

describe("classifyNetopiaStatus", () => {
  it("maps NETOPIA statuses to payment outcomes", () => {
    expect(classifyNetopiaStatus(3)).toBe("paid");
    expect(classifyNetopiaStatus(5)).toBe("paid");
    expect(classifyNetopiaStatus(12)).toBe("failed");
    expect(classifyNetopiaStatus(4)).toBe("failed");
    expect(classifyNetopiaStatus(23)).toBe("failed");
    expect(classifyNetopiaStatus(8)).toBe("refunded");
    for (const interim of [1, 2, 6, 13, 14, 15])
      expect(classifyNetopiaStatus(interim)).toBe("pending");
  });
});

describe("verifyNetopiaIpn", () => {
  it("accepts a correctly signed notification and returns its payload", () => {
    const result = check(token(ipnBody));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.payload.payment).toMatchObject({ status: 3, amount: 123.45, ntpID: "1234567" });
      expect(result.payload.order.orderID).toBe("AR-2026-000042_a1b2c3d4");
    }
  });

  it("accepts time claims in seconds as well as milliseconds", () => {
    const seconds = Math.floor(NOW / 1000);
    expect(check(token(ipnBody, { claims: { iat: seconds, exp: seconds + 60 } })).ok).toBe(true);
  });

  it("rejects a missing or malformed token", () => {
    expect(check(null)).toEqual({ ok: false, error: "missing Verification-token" });
    expect(check("abc.def")).toMatchObject({ ok: false });
  });

  it("rejects a body that differs from the signed hash", () => {
    const tampered = ipnBody.replace("123.45", "1.00");
    expect(check(token(ipnBody), tampered)).toEqual({ ok: false, error: "payload hash mismatch" });
  });

  it("rejects tokens signed by another key", () => {
    const other = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
    expect(check(token(ipnBody, { key: other }))).toEqual({
      ok: false,
      error: "invalid signature",
    });
  });

  it("rejects unsigned or HMAC tokens", () => {
    expect(check(token(ipnBody, { header: { alg: "none" } }))).toMatchObject({ ok: false });
    expect(check(token(ipnBody, { header: { alg: "HS256" } }))).toMatchObject({ ok: false });
  });

  it("rejects the wrong issuer, audience or an expired token", () => {
    expect(check(token(ipnBody, { claims: { iss: "Someone" } }))).toEqual({
      ok: false,
      error: "invalid issuer",
    });
    expect(check(token(ipnBody, { claims: { aud: ["OTHER-POS"] } }))).toEqual({
      ok: false,
      error: "invalid audience",
    });
    expect(check(token(ipnBody, { claims: { exp: NOW - 10 * 60_000 } }))).toEqual({
      ok: false,
      error: "token expired",
    });
  });

  it("rejects a signed body that is not a payment notification", () => {
    const body = JSON.stringify({ hello: "world" });
    expect(check(token(body), body)).toEqual({ ok: false, error: "unexpected payload format" });
  });

  it("fails closed on an unusable public key", () => {
    expect(check(token(ipnBody), ipnBody, "not a key")).toMatchObject({ ok: false });
  });
});

describe("ipnReply", () => {
  it("uses NETOPIA's error types", () => {
    expect(ipnReply("ok")).toEqual({ errorType: 0, errorCode: null, errorMessage: "" });
    expect(ipnReply("temporary").errorType).toBe(1);
    expect(ipnReply("permanent", "x")).toMatchObject({ errorType: 2, errorMessage: "x" });
  });
});
