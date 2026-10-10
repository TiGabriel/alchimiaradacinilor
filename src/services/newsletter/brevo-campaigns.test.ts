import { describe, expect, it, vi } from "vitest";

import { brevoCampaigns, brevoErrorMessage, campaignStatsFrom } from "./brevo-campaigns";

function fakeFetch(...responses: Array<Response | Error>) {
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const next = responses.shift() ?? new Response(null, { status: 204 });
    if (next instanceof Error) throw next;
    return next;
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const content = {
  name: "Toamna · 2026-10-10",
  subject: "15% pentru ritualurile tale de toamnă",
  previewText: "Cu codul TOAMNA15",
  html: '<a href="{{ unsubscribe }}">x</a>',
  sender: { name: "Alchimia Rădăcinilor", email: "noreply@alchimiaradacinilor.ro" },
  listId: 3,
};

describe("brevoCampaigns", () => {
  it("creates a campaign for the list with the HTML, preheader and sender", async () => {
    const { fetch, calls } = fakeFetch(json({ id: 42 }, 201));
    const result = await brevoCampaigns({ apiKey: "k", fetch }).create(content);
    expect(result).toEqual({ ok: true, data: 42 });
    expect(calls[0]).toMatchObject({
      url: "https://api.brevo.com/v3/emailCampaigns",
      method: "POST",
      body: {
        name: content.name,
        subject: content.subject,
        previewText: "Cu codul TOAMNA15",
        htmlContent: content.html,
        sender: content.sender,
        recipients: { listIds: [3] },
        mirrorActive: true,
        inlineImageActivation: false,
      },
    });
  });

  it("reports a send as accepted only on the Brevo 204", async () => {
    const accepted = fakeFetch(new Response(null, { status: 204 }));
    expect(await brevoCampaigns({ apiKey: "k", fetch: accepted.fetch }).sendNow(42)).toEqual({
      ok: true,
      data: null,
    });
    expect(accepted.calls[0]).toMatchObject({
      url: "https://api.brevo.com/v3/emailCampaigns/42/sendNow",
      method: "POST",
    });

    const other = fakeFetch(json({}, 200));
    expect((await brevoCampaigns({ apiKey: "k", fetch: other.fetch }).sendNow(42)).ok).toBe(false);
  });

  it("turns errors and timeouts into Romanian messages", async () => {
    const { fetch } = fakeFetch(
      json({ code: "not_enough_credits", message: "Insufficient credits" }, 402),
      new Error("The operation was aborted due to timeout"),
    );
    const client = brevoCampaigns({ apiKey: "k", fetch });
    expect(await client.sendNow(1)).toEqual({
      ok: false,
      error: "Contul Brevo nu are suficiente credite de email pentru această campanie.",
    });
    const timeout = await client.sendNow(1);
    expect(timeout.ok).toBe(false);
    expect(!timeout.ok && timeout.error).toMatch(/^Brevo nu a răspuns/);
  });

  it("reads the campaign status, sent date and statistics", async () => {
    const { fetch, calls } = fakeFetch(
      json({
        status: "sent",
        sentDate: "2026-10-12T08:00:00.000Z",
        statistics: {
          globalStats: { delivered: 0 },
          campaignStats: [
            { sent: 10, delivered: 9, uniqueViews: 5, uniqueClicks: 2, unsubscriptions: 1 },
          ],
        },
      }),
    );
    const result = await brevoCampaigns({ apiKey: "k", fetch }).get(42);
    expect(calls[0]!.url).toBe(
      "https://api.brevo.com/v3/emailCampaigns/42?statistics=globalStats&excludeHtmlContent=true",
    );
    expect(result).toEqual({
      ok: true,
      data: {
        status: "sent",
        sentDate: new Date("2026-10-12T08:00:00.000Z"),
        stats: { sent: 10, delivered: 9, opens: 5, clicks: 2, unsubscribes: 1, bounces: 0 },
      },
    });
  });

  it("lists senders and the contacts of the list who can receive", async () => {
    const { fetch } = fakeFetch(
      json({
        senders: [{ id: 1, name: "A", email: "NoReply@Alchimiaradacinilor.ro", active: true }],
      }),
      json({ id: 3, totalSubscribers: 12, totalBlacklisted: 2, uniqueSubscribers: 12 }),
    );
    const client = brevoCampaigns({ apiKey: "k", fetch });
    expect(await client.senders()).toEqual({
      ok: true,
      data: [{ email: "noreply@alchimiaradacinilor.ro", active: true }],
    });
    expect(await client.listRecipients(3)).toEqual({ ok: true, data: 10 });
  });
});

describe("campaignStatsFrom", () => {
  it("sums the per-list figures, falling back to the overall ones", () => {
    expect(
      campaignStatsFrom({
        campaignStats: [
          { sent: 3, delivered: 3, hardBounces: 1 },
          { sent: 2, delivered: 1, softBounces: 1 },
        ],
      }),
    ).toMatchObject({ sent: 5, delivered: 4, bounces: 2 });
    expect(campaignStatsFrom({ globalStats: { delivered: 7, uniqueViews: 3 } })).toMatchObject({
      delivered: 7,
      opens: 3,
    });
    expect(campaignStatsFrom(null)).toBeNull();
  });
});

describe("brevoErrorMessage", () => {
  it("names the cause the admin can fix", () => {
    expect(brevoErrorMessage(401, '{"code":"unauthorized","message":"Key not found"}')).toMatch(
      /BREVO_API_KEY/,
    );
    expect(
      brevoErrorMessage(
        401,
        '{"code":"unauthorized","message":"We have detected you are using an unrecognised IP address"}',
      ),
    ).toMatch(/Authorised IPs/);
    expect(
      brevoErrorMessage(
        400,
        '{"code":"invalid_parameter","message":"Sender is invalid / inactive"}',
      ),
    ).toMatch(/expeditorul/);
    expect(
      brevoErrorMessage(400, '{"code":"campaign_sent","message":"Campaign already sent"}'),
    ).toMatch(/deja trimisă/);
    expect(brevoErrorMessage(500, "oops")).toBe("Brevo a refuzat cererea (500): oops");
  });
});
