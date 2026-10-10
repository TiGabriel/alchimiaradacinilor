/**
 * NETOPIA Payments API v2 (card, hosted payment page) — pure helpers, unit-tested.
 *
 * Flow: the server sends `POST /payment/card/start` without card data; NETOPIA
 * answers with `payment.paymentURL`, its hosted page where the customer enters
 * the card (3-D Secure included). The result reaches us only through the IPN
 * (`notifyUrl`), signed with a JWT in the `Verification-token` header. The
 * browser's return to `redirectUrl` is never treated as proof of payment.
 *
 * Reference: NETOPIA's OpenAPI spec (servers, /payment/card/start, notify
 * schema) and their official SDKs' IPN verification (iss "NETOPIA Payments",
 * aud = POS signature, sub = base64(sha512(raw body))).
 */
import { createHash, createPublicKey, verify, X509Certificate, type KeyObject } from "node:crypto";

import { z } from "zod";

import { ORDER_NUMBER_PATTERN } from "../orders/status";

export const NETOPIA_API_URLS = {
  sandbox: "https://secure.sandbox.netopia-payments.com",
  live: "https://secure.mobilpay.ro/pay",
} as const;

export type NetopiaEnvironment = keyof typeof NETOPIA_API_URLS;

export type NetopiaConfig = {
  environment: NetopiaEnvironment;
  apiKey: string;
  posSignature: string;
  publicKey: string;
  /** Public base URL of the shop (notify/return URLs), without a trailing slash. */
  appUrl: string;
};

/** Complete configuration, or null — card payments are then not offered at all. */
export function readNetopiaConfig(source: {
  NETOPIA_ENV?: NetopiaEnvironment;
  NETOPIA_API_KEY?: string;
  NETOPIA_POS_SIGNATURE?: string;
  NETOPIA_PUBLIC_KEY?: string;
  APP_URL: string;
}): NetopiaConfig | null {
  const apiKey = source.NETOPIA_API_KEY?.trim();
  const posSignature = source.NETOPIA_POS_SIGNATURE?.trim();
  const publicKey = source.NETOPIA_PUBLIC_KEY ? normalisePem(source.NETOPIA_PUBLIC_KEY) : "";
  if (!source.NETOPIA_ENV || !apiKey || !posSignature || !publicKey) return null;
  return {
    environment: source.NETOPIA_ENV,
    apiKey,
    posSignature,
    publicKey,
    appUrl: source.APP_URL.replace(/\/$/, ""),
  };
}

/** Accepts a PEM pasted with real newlines or with "\n" escapes (single-line env vars). */
export function normalisePem(value: string): string {
  return value.replace(/\\n/g, "\n").trim();
}

// ── Order ids ──────────────────────────────────────────────────────────────

/**
 * NETOPIA rejects a reused order id, so every payment attempt gets its own:
 * the order number plus a random suffix (AR-2026-000123_k3f9x2).
 */
export function netopiaOrderId(orderNumber: string, suffix: string): string {
  return `${orderNumber}_${suffix}`;
}

/** The shop's order number from a NETOPIA order id, or null when it does not match. */
export function orderNumberFromNetopiaId(orderId: string): string | null {
  const number = orderId.split("_")[0] ?? "";
  return ORDER_NUMBER_PATTERN.test(number) ? number : null;
}

// ── Start request ──────────────────────────────────────────────────────────

/** ISO 3166-1 numeric code; the shop ships only within Romania. */
const ROMANIA = 642;

type OrderAddressSnapshot = {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  streetExtra: string | null;
  city: string;
  county: string;
  postalCode: string;
};

export type NetopiaOrder = {
  number: string;
  /** Minor units (bani), from the stored order — never from the client. */
  total: number;
  currency: string;
  email: string;
  placedAt: Date;
  items: Array<{ productName: string; sku: string; unitPrice: number; quantity: number }>;
  billing: OrderAddressSnapshot;
  shipping: OrderAddressSnapshot;
};

/** Bani → the decimal amount NETOPIA expects (4999 → 49.99). */
export function toNetopiaAmount(minor: number): number {
  if (!Number.isInteger(minor) || minor < 0) throw new TypeError(`Invalid amount: ${minor}`);
  return Math.round(minor) / 100;
}

function address(a: OrderAddressSnapshot, email: string) {
  return {
    email,
    phone: a.phone,
    firstName: a.firstName,
    lastName: a.lastName,
    city: a.city,
    country: ROMANIA,
    countryName: "Romania",
    state: a.county,
    postalCode: a.postalCode,
    details: [a.street, a.streetExtra].filter(Boolean).join(", "),
  };
}

/** Body of `POST /payment/card/start`. No card data: the customer types it on NETOPIA's page. */
export function buildStartRequest(input: {
  config: NetopiaConfig;
  order: NetopiaOrder;
  orderId: string;
  vatRatePercent: number;
  siteName: string;
}) {
  const { config, order } = input;
  const returnUrl = `${config.appUrl}/api/plati/netopia/retur?comanda=${encodeURIComponent(order.number)}`;
  return {
    config: {
      emailTemplate: "",
      emailSubject: "",
      notifyUrl: `${config.appUrl}/api/plati/netopia/ipn`,
      redirectUrl: returnUrl,
      cancelUrl: returnUrl,
      language: "ro",
    },
    payment: {
      options: { installments: 0, bonus: 0 },
      instrument: { type: "card" },
      data: {},
    },
    order: {
      ntpID: "",
      posSignature: config.posSignature,
      dateTime: order.placedAt.toISOString(),
      description: `Comanda ${order.number} · ${input.siteName}`,
      orderID: input.orderId,
      amount: toNetopiaAmount(order.total),
      currency: order.currency,
      billing: address(order.billing, order.email),
      shipping: address(order.shipping, order.email),
      products: order.items.map((i) => ({
        name: `${i.productName} × ${i.quantity}`,
        code: i.sku,
        category: "",
        price: toNetopiaAmount(i.unitPrice * i.quantity),
        vat: input.vatRatePercent,
      })),
      installments: { selected: 0, available: [0] },
      data: {},
    },
  };
}

const startResponseSchema = z.object({
  payment: z
    .object({
      ntpID: z.union([z.string(), z.number()]).transform(String).optional(),
      status: z.number().optional(),
      paymentURL: z.string().optional(),
    })
    .optional(),
  error: z
    .object({ code: z.union([z.string(), z.number()]).optional(), message: z.string().optional() })
    .optional(),
  code: z.union([z.string(), z.number()]).optional(),
  message: z.string().optional(),
});

export type StartOutcome =
  { ok: true; paymentUrl: string; ntpId: string | null } | { ok: false; error: string };

/** Interprets the start response: only an https payment page counts as success. */
export function parseStartResponse(httpStatus: number, body: unknown): StartOutcome {
  const parsed = startResponseSchema.safeParse(body);
  const data = parsed.success ? parsed.data : {};
  const url = data.payment?.paymentURL;
  if (httpStatus >= 200 && httpStatus < 300 && url && /^https:\/\//.test(url))
    return { ok: true, paymentUrl: url, ntpId: data.payment?.ntpID ?? null };
  const code = data.error?.code ?? data.code ?? "?";
  const message = data.error?.message ?? data.message ?? "fără mesaj";
  return { ok: false, error: `NETOPIA ${httpStatus} (cod ${code}): ${message}` };
}

// ── Payment status ─────────────────────────────────────────────────────────

/**
 * NETOPIA payment statuses (from their SDKs): 3 paid (captured), 5 confirmed,
 * 4 cancelled, 8 credit (refunded), 11 error, 12 declined, 23 expired; the rest
 * (1 new, 2 opened, 6 pending, 13 fraud review, 14/15 authentication…) are interim.
 */
export type CardPaymentOutcome = "paid" | "failed" | "refunded" | "pending";

export function classifyNetopiaStatus(status: number): CardPaymentOutcome {
  if (status === 3 || status === 5) return "paid";
  if (status === 8) return "refunded";
  if ([4, 11, 12, 23].includes(status)) return "failed";
  return "pending";
}

/** True when the notified amount and currency are exactly the stored order total. */
export function amountMatches(
  payment: { amount: number; currency: string },
  order: { total: number; currency: string },
): boolean {
  return (
    Math.round(payment.amount * 100) === order.total &&
    payment.currency.toUpperCase() === order.currency.toUpperCase()
  );
}

// ── IPN verification ───────────────────────────────────────────────────────

export const ipnPayloadSchema = z.object({
  payment: z.object({
    status: z.number().int(),
    ntpID: z.union([z.string(), z.number()]).transform(String).optional(),
    amount: z.number().nonnegative(),
    currency: z.string().length(3),
    message: z.string().optional(),
  }),
  order: z.object({ orderID: z.string().min(1).max(100) }),
});

export type IpnPayload = z.infer<typeof ipnPayloadSchema>;

export type IpnVerification = { ok: true; payload: IpnPayload } | { ok: false; error: string };

const RSA_ALGORITHMS = new Map([
  ["RS256", "sha256"],
  ["RS384", "sha384"],
  ["RS512", "sha512"],
]);

/** Clock skew allowed on the token's time claims. */
const LEEWAY_MS = 5 * 60 * 1000;

function publicKeyFrom(pem: string): KeyObject {
  return pem.includes("BEGIN CERTIFICATE")
    ? new X509Certificate(pem).publicKey
    : createPublicKey(pem);
}

/** JWT time claims; NETOPIA's PHP SDK compares them in milliseconds, so accept both units. */
function claimMs(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value > 1e11 ? value : value * 1000;
}

function decodeJson(segment: string): unknown {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
}

/**
 * Verifies an IPN: RSA signature with NETOPIA's public key, issuer, audience
 * (our POS signature), time claims, and that `sub` is the SHA-512 of the exact
 * raw body. Only then is the body parsed.
 */
export function verifyNetopiaIpn(input: {
  token: string | null;
  rawBody: Buffer;
  publicKey: string;
  posSignature: string;
  now?: number;
}): IpnVerification {
  const now = input.now ?? Date.now();
  if (!input.token) return { ok: false, error: "missing Verification-token" };
  const parts = input.token.split(".");
  if (parts.length !== 3) return { ok: false, error: "malformed token" };
  const [head, body, signature] = parts as [string, string, string];

  let header: { alg?: unknown; typ?: unknown };
  let claims: Record<string, unknown>;
  try {
    header = decodeJson(head) as typeof header;
    claims = decodeJson(body) as Record<string, unknown>;
  } catch {
    return { ok: false, error: "malformed token" };
  }
  if (header.typ !== undefined && header.typ !== "JWT")
    return { ok: false, error: "wrong token type" };
  const hash = typeof header.alg === "string" ? RSA_ALGORITHMS.get(header.alg) : undefined;
  if (!hash) return { ok: false, error: "unsupported algorithm" };

  let valid = false;
  try {
    valid = verify(
      hash,
      Buffer.from(`${head}.${body}`),
      publicKeyFrom(input.publicKey),
      Buffer.from(signature, "base64url"),
    );
  } catch {
    return { ok: false, error: "invalid public key or signature" };
  }
  if (!valid) return { ok: false, error: "invalid signature" };

  if (claims.iss !== "NETOPIA Payments") return { ok: false, error: "invalid issuer" };
  const aud = Array.isArray(claims.aud) ? claims.aud[0] : claims.aud;
  if (typeof aud !== "string" || aud !== input.posSignature)
    return { ok: false, error: "invalid audience" };
  const exp = claimMs(claims.exp);
  if (exp !== null && exp + LEEWAY_MS < now) return { ok: false, error: "token expired" };
  const nbf = claimMs(claims.nbf);
  if (nbf !== null && nbf - LEEWAY_MS > now) return { ok: false, error: "token not yet valid" };

  const digest = createHash("sha512").update(input.rawBody).digest("base64");
  if (claims.sub !== digest) return { ok: false, error: "payload hash mismatch" };

  let json: unknown;
  try {
    json = JSON.parse(input.rawBody.toString("utf8"));
  } catch {
    return { ok: false, error: "payload is not JSON" };
  }
  const payload = ipnPayloadSchema.safeParse(json);
  return payload.success
    ? { ok: true, payload: payload.data }
    : { ok: false, error: "unexpected payload format" };
}

/** Body NETOPIA expects in reply to an IPN. A temporary error makes NETOPIA retry later. */
export function ipnReply(kind: "ok" | "temporary" | "permanent", message = "") {
  return {
    errorType: kind === "ok" ? 0 : kind === "temporary" ? 1 : 2,
    errorCode: kind === "ok" ? null : 0x10000101,
    errorMessage: message,
  };
}
