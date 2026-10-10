import { describe, expect, it, vi } from "vitest";

import {
  brevoAttributes,
  brevoProvider,
  brevoWebhookAuthorized,
  parseBrevoSuppressions,
} from "./brevo";

function fakeFetch(...responses: Response[]) {
  const calls: Array<{ url: string; init: RequestInit; body: Record<string, unknown> }> = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init!, body: JSON.parse(String(init!.body)) });
    return responses.shift() ?? new Response(null, { status: 204 });
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

const contact = {
  email: "ana@example.ro",
  firstName: "Ana",
  source: "footer",
  confirmedAt: new Date("2026-10-01T08:00:00Z"),
};

describe("brevoProvider.subscribe", () => {
  it("adds the confirmed contact to the list with its consent details", async () => {
    const { fetch, calls } = fakeFetch(new Response('{"id":1}', { status: 201 }));
    const result = await brevoProvider({ apiKey: "k", listId: 7, fetch }).subscribe(contact);
    expect(result).toEqual({ ok: true });
    expect(calls[0]!.url).toBe("https://api.brevo.com/v3/contacts");
    expect((calls[0]!.init.headers as Record<string, string>)["api-key"]).toBe("k");
    expect(calls[0]!.body).toEqual({
      email: "ana@example.ro",
      listIds: [7],
      updateEnabled: true,
      attributes: { FIRSTNAME: "Ana", SURSA_ABONARE: "footer", DATA_ABONARE: "2026-10-01" },
    });
  });

  it("never lifts a Brevo blocklisting unless the person just opted in again", async () => {
    const reconcile = fakeFetch();
    await brevoProvider({ apiKey: "k", listId: 7, fetch: reconcile.fetch }).subscribe(contact);
    expect(reconcile.calls[0]!.body).not.toHaveProperty("emailBlacklisted");

    const fresh = fakeFetch();
    await brevoProvider({ apiKey: "k", listId: 7, fetch: fresh.fetch }).subscribe(contact, {
      freshConsent: true,
    });
    expect(fresh.calls[0]!.body.emailBlacklisted).toBe(false);
  });

  it("keeps the subscription when attributes are missing in Brevo", async () => {
    const { fetch, calls } = fakeFetch(
      new Response('{"code":"invalid_parameter"}', { status: 400 }),
      new Response(null, { status: 204 }),
    );
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await brevoProvider({ apiKey: "k", listId: 7, fetch }).subscribe(contact);
    expect(result).toEqual({ ok: true });
    expect(calls).toHaveLength(2);
    expect(calls[1]!.body).not.toHaveProperty("attributes");
  });

  it("reports provider errors instead of throwing", async () => {
    const { fetch } = fakeFetch(new Response("unauthorized", { status: 401 }));
    const result = await brevoProvider({ apiKey: "bad", listId: 7, fetch }).subscribe({
      email: "x@example.ro",
    });
    expect(result).toEqual({ ok: false, error: "Brevo 401: unauthorized" });

    const failing = vi.fn(async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    expect(
      await brevoProvider({ apiKey: "k", listId: 7, fetch: failing }).subscribe(contact),
    ).toEqual({ ok: false, error: "network down" });
  });
});

describe("brevoProvider.unsubscribe", () => {
  it("removes the contact from the list and blocklists it", async () => {
    const { fetch, calls } = fakeFetch(new Response(null, { status: 204 }));
    expect(await brevoProvider({ apiKey: "k", listId: 7, fetch }).unsubscribe("a+b@ex.ro")).toEqual(
      { ok: true },
    );
    expect(calls[0]!.url).toBe(
      "https://api.brevo.com/v3/contacts/a%2Bb%40ex.ro?identifierType=email_id",
    );
    expect(calls[0]!.init.method).toBe("PUT");
    expect(calls[0]!.body).toEqual({ emailBlacklisted: true, unlinkListIds: [7] });
  });

  it("treats an unknown contact as already unsubscribed", async () => {
    const { fetch } = fakeFetch(new Response("not found", { status: 404 }));
    expect(await brevoProvider({ apiKey: "k", listId: 7, fetch }).unsubscribe("x@ex.ro")).toEqual({
      ok: true,
    });
  });
});

describe("brevoAttributes", () => {
  it("sends only what is known", () => {
    expect(brevoAttributes({ email: "x@ex.ro" })).toEqual({});
  });
});

describe("parseBrevoSuppressions", () => {
  it("keeps unsubscribes, complaints and hard bounces, single or batched", () => {
    expect(
      parseBrevoSuppressions([
        { event: "unsubscribe", email: " Ana@Example.ro ", list_id: [7] },
        { event: "spam", email: "b@ex.ro" },
        { event: "hard_bounce", email: "c@ex.ro" },
        { event: "opened", email: "d@ex.ro" },
        { event: "unsubscribe", email: "not-an-email" },
        { event: "constructor", email: "e@ex.ro" },
        null,
      ]),
    ).toEqual([
      { email: "ana@example.ro", reason: "unsubscribe" },
      { email: "b@ex.ro", reason: "spam" },
      { email: "c@ex.ro", reason: "hard_bounce" },
    ]);
    expect(parseBrevoSuppressions({ event: "unsubscribed", email: "x@ex.ro" })).toEqual([
      { email: "x@ex.ro", reason: "unsubscribe" },
    ]);
  });
});

describe("brevoWebhookAuthorized", () => {
  const secret = "s".repeat(32);
  it("accepts the secret as a custom header or bearer token only", () => {
    expect(brevoWebhookAuthorized(new Headers({ "x-webhook-secret": secret }), secret)).toBe(true);
    expect(brevoWebhookAuthorized(new Headers({ authorization: `Bearer ${secret}` }), secret)).toBe(
      true,
    );
    expect(brevoWebhookAuthorized(new Headers({ "x-webhook-secret": "wrong" }), secret)).toBe(
      false,
    );
    expect(brevoWebhookAuthorized(new Headers(), secret)).toBe(false);
  });
});
