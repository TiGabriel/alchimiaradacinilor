import { createHash, generateKeyPairSync, sign } from "node:crypto";

import { beforeEach, describe, expect, it, vi } from "vitest";

// Test-only key pair standing in for NETOPIA's signing key.
const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const POS = "TEST-POS";

const state = vi.hoisted(() => ({
  env: {} as Record<string, unknown>,
  order: null as null | Record<string, unknown>,
  events: [] as Array<Record<string, unknown>>,
  failTransaction: false,
}));

vi.mock("@/lib/env", () => ({ env: () => state.env }));
vi.mock("@/services/settings", () => ({ getSettings: vi.fn() }));
vi.mock("@/lib/db", () => {
  const tx = {
    $queryRaw: async (_sql: TemplateStringsArray, number: string) =>
      state.order && state.order.number === number && state.order.paymentMethod === "CARD"
        ? [{ id: state.order.id }]
        : [],
    order: {
      findUniqueOrThrow: async () => ({ ...state.order }),
      update: async ({ data }: { data: Record<string, unknown> }) =>
        Object.assign(state.order!, data),
    },
    orderStatusEvent: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.events.push(data);
        return data;
      },
    },
  };
  return {
    db: {
      $transaction: async (fn: (t: typeof tx) => unknown) => {
        if (state.failTransaction) throw new Error("database unavailable");
        return fn(tx);
      },
    },
  };
});

const { handleNetopiaIpn } = await import("./netopia-service");

function notification(status: number, amount = 123.45, orderID = "AR-2026-000042_a1b2c3d4") {
  const body = JSON.stringify({
    payment: { method: "card", ntpID: "998877", status, amount, currency: "RON" },
    order: { orderID },
  });
  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const head = b64({ typ: "JWT", alg: "RS512" });
  const claims = b64({
    iss: "NETOPIA Payments",
    aud: [POS],
    iat: Date.now(),
    exp: Date.now() + 60_000,
    sub: createHash("sha512").update(body).digest("base64"),
  });
  const signature = sign("sha512", Buffer.from(`${head}.${claims}`), privateKey).toString(
    "base64url",
  );
  return { token: `${head}.${claims}.${signature}`, body: Buffer.from(body) };
}

async function deliver(n: { token: string; body: Buffer }) {
  return handleNetopiaIpn(n.token, n.body);
}

beforeEach(() => {
  state.env = {
    APP_URL: "https://example.ro",
    NETOPIA_ENV: "live",
    NETOPIA_API_KEY: "key",
    NETOPIA_POS_SIGNATURE: POS,
    NETOPIA_PUBLIC_KEY: publicKey.export({ type: "spki", format: "pem" }).toString(),
  };
  state.order = {
    id: "o1",
    number: "AR-2026-000042",
    paymentMethod: "CARD",
    status: "PENDING",
    paymentStatus: "UNPAID",
    total: 12345,
    currency: "RON",
  };
  state.events = [];
  state.failTransaction = false;
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("handleNetopiaIpn", () => {
  it("records a confirmed payment once, with the NETOPIA transaction id", async () => {
    const paid = notification(3);
    expect(await deliver(paid)).toEqual({ errorType: 0, errorCode: null, errorMessage: "" });
    expect(state.order).toMatchObject({
      paymentStatus: "PAID",
      paymentProvider: "netopia",
      paymentReference: "998877",
    });
    expect(state.order!.paidAt).toBeInstanceOf(Date);
    expect(state.events).toHaveLength(1);

    // Duplicate delivery (and a later "confirmed" status) change nothing.
    expect((await deliver(paid)).errorType).toBe(0);
    expect((await deliver(notification(5))).errorType).toBe(0);
    expect(state.events).toHaveLength(1);
  });

  it("never lets a later failed attempt undo a recorded payment", async () => {
    await deliver(notification(3));
    await deliver(notification(12, 123.45, "AR-2026-000042_ffff0000"));
    expect(state.order!.paymentStatus).toBe("PAID");
  });

  it("marks a declined payment as failed, then accepts a successful retry", async () => {
    await deliver(notification(12));
    expect(state.order!.paymentStatus).toBe("FAILED");
    expect(String(state.events[0]!.note)).toContain("nu a fost finalizată");
    await deliver(notification(3, 123.45, "AR-2026-000042_00aa11bb"));
    expect(state.order!.paymentStatus).toBe("PAID");
  });

  it("ignores interim statuses", async () => {
    expect((await deliver(notification(15))).errorType).toBe(0);
    expect(state.order!.paymentStatus).toBe("UNPAID");
    expect(state.events).toHaveLength(0);
  });

  it("refuses to mark paid when the amount differs from the stored total", async () => {
    const reply = await deliver(notification(3, 1.0));
    expect(reply.errorType).toBe(2);
    expect(state.order!.paymentStatus).toBe("UNPAID");
  });

  it("changes nothing for an invalid signature or an unknown order", async () => {
    const forged = notification(3);
    const tampered = Buffer.from(forged.body.toString().replace("998877", "000000"));
    expect((await handleNetopiaIpn(forged.token, tampered)).errorType).toBe(2);
    expect((await handleNetopiaIpn(null, forged.body)).errorType).toBe(2);
    expect((await deliver(notification(3, 123.45, "AR-2026-999999_x"))).errorType).toBe(2);
    expect(state.order!.paymentStatus).toBe("UNPAID");
  });

  it("asks NETOPIA to retry when the database is unavailable", async () => {
    state.failTransaction = true;
    expect((await deliver(notification(3))).errorType).toBe(1);
  });

  it("labels sandbox payments as test payments", async () => {
    state.env.NETOPIA_ENV = "sandbox";
    await deliver(notification(3));
    expect(String(state.events[0]!.note)).toContain("sandbox");
  });

  it("refuses notifications when card payments are not configured", async () => {
    state.env.NETOPIA_PUBLIC_KEY = undefined;
    expect((await deliver(notification(3))).errorType).toBe(2);
    expect(state.order!.paymentStatus).toBe("UNPAID");
  });
});
