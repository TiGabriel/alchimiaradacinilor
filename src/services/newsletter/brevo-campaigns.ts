/**
 * Brevo email campaigns API over plain HTTP — no SDK. Pure: the caller passes
 * the credentials and, in tests, a fake `fetch`. Every failure comes back as a
 * Romanian message for the admin; success is reported only when Brevo answered
 * with its documented success status.
 */
import { z } from "zod";

const API = "https://api.brevo.com/v3";

export type BrevoResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type BrevoCampaignContent = {
  name: string;
  subject: string;
  previewText?: string | null;
  html: string;
  sender: { name: string; email: string };
  listId: number;
};

/** Delivery figures shown on a sent campaign. */
export type BrevoCampaignStats = {
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  unsubscribes: number;
  bounces: number;
};

export type BrevoCampaignState = {
  /** draft, queued, in_process, sent, suspended, archive… */
  status: string;
  sentDate: Date | null;
  stats: BrevoCampaignStats | null;
};

const count = z
  .number()
  .nullish()
  .transform((n) => n ?? 0);
const statsSchema = z.object({
  sent: count,
  delivered: count,
  uniqueViews: count,
  uniqueClicks: count,
  unsubscriptions: count,
  hardBounces: count,
  softBounces: count,
});
type RawStats = z.infer<typeof statsSchema>;

const brevoCampaignSchema = z.object({
  status: z.string(),
  sentDate: z.string().nullish(),
  statistics: z
    .object({
      globalStats: statsSchema.partial().nullish(),
      campaignStats: z.array(statsSchema.partial()).nullish(),
    })
    .nullish(),
});

/**
 * Totals of a campaign. Brevo reports per list (`campaignStats`) and overall
 * (`globalStats`); the overall block can stay empty for a while after sending,
 * so the per-list figures win when there are any.
 */
export function campaignStatsFrom(statistics: unknown): BrevoCampaignStats | null {
  const parsed = brevoCampaignSchema.shape.statistics.safeParse(statistics);
  if (!parsed.success || !parsed.data) return null;
  const { globalStats, campaignStats } = parsed.data;
  const rows: Array<Partial<RawStats>> = campaignStats?.length
    ? campaignStats
    : globalStats
      ? [globalStats]
      : [];
  if (!rows.length) return null;
  const sum = (key: keyof RawStats) => rows.reduce((total, row) => total + (row[key] ?? 0), 0);
  return {
    sent: sum("sent"),
    delivered: sum("delivered"),
    opens: sum("uniqueViews"),
    clicks: sum("uniqueClicks"),
    unsubscribes: sum("unsubscriptions"),
    bounces: sum("hardBounces") + sum("softBounces"),
  };
}

/** A Brevo error answer turned into a message the admin can act on. */
export function brevoErrorMessage(status: number, body: string): string {
  let code = "";
  let message = body.slice(0, 200);
  try {
    const parsed = JSON.parse(body) as { code?: unknown; message?: unknown };
    if (typeof parsed.code === "string") code = parsed.code;
    if (typeof parsed.message === "string") message = parsed.message.slice(0, 200);
  } catch {
    // Not JSON: keep the raw text.
  }
  const text = `${code} ${message}`.toLowerCase();
  if (status === 401 || code === "unauthorized" || text.includes("key not found"))
    return text.includes("ip")
      ? "Brevo a refuzat cererea: adresa IP a serverului nu este autorizată (Brevo → Security → Authorised IPs)."
      : "Cheia API Brevo nu este validă. Verifică BREVO_API_KEY.";
  if (code === "permission_denied" || status === 403)
    return "Cheia API Brevo nu are drept pentru campanii de email.";
  if (status === 402 || code === "not_enough_credits" || text.includes("credit"))
    return "Contul Brevo nu are suficiente credite de email pentru această campanie.";
  if (text.includes("sender"))
    return "Brevo nu acceptă expeditorul: adresa trebuie adăugată și verificată în Brevo (Senders, Domains & Dedicated IPs).";
  if (code === "campaign_sent" || code === "campaign_processing")
    return "Campania a fost deja trimisă din Brevo sau este în curs de trimitere.";
  if (code === "account_under_validation")
    return "Contul Brevo este în curs de validare; campaniile pot fi trimise după aprobarea contului.";
  return `Brevo a refuzat cererea (${status}${code ? `, ${code}` : ""}): ${message}`;
}

export type BrevoCampaignsClient = ReturnType<typeof brevoCampaigns>;

export function brevoCampaigns(config: {
  apiKey: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}) {
  const doFetch = config.fetch ?? fetch;
  const timeoutMs = config.timeoutMs ?? 10_000;

  async function call<T>(
    method: "GET" | "POST" | "PUT",
    path: string,
    expected: number,
    read: (json: unknown) => T,
    body?: unknown,
  ): Promise<BrevoResult<T>> {
    let res: Response;
    try {
      res = await doFetch(`${API}${path}`, {
        method,
        headers: {
          "api-key": config.apiKey,
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      return { ok: false, error: `Brevo nu a răspuns (${reason}). Încearcă din nou.` };
    }
    if (res.status !== expected)
      return { ok: false, error: brevoErrorMessage(res.status, await res.text()) };
    try {
      return { ok: true, data: read(expected === 204 ? null : await res.json()) };
    } catch {
      return { ok: false, error: "Brevo a trimis un răspuns neașteptat." };
    }
  }

  const contentBody = (c: BrevoCampaignContent) => ({
    name: c.name,
    subject: c.subject,
    ...(c.previewText ? { previewText: c.previewText } : {}),
    htmlContent: c.html,
    sender: c.sender,
    recipients: { listIds: [c.listId] },
    mirrorActive: true,
  });

  return {
    /** Creates a draft campaign in Brevo; returns its id. */
    create: (content: BrevoCampaignContent) =>
      call("POST", "/emailCampaigns", 201, (json) => z.object({ id: z.number() }).parse(json).id, {
        ...contentBody(content),
        inlineImageActivation: false,
      }),
    /** Replaces the content of a Brevo campaign that is still a draft. */
    update: (id: number, content: BrevoCampaignContent) =>
      call("PUT", `/emailCampaigns/${id}`, 204, () => null, contentBody(content)),
    /** Starts sending now. Success only on Brevo's 204 ("scheduled to send"). */
    sendNow: (id: number) => call("POST", `/emailCampaigns/${id}/sendNow`, 204, () => null),
    /** Current status, sent date and statistics. */
    get: (id: number) =>
      call(
        "GET",
        `/emailCampaigns/${id}?statistics=globalStats&excludeHtmlContent=true`,
        200,
        (json): BrevoCampaignState => {
          const c = brevoCampaignSchema.parse(json);
          return {
            status: c.status,
            sentDate: c.sentDate ? new Date(c.sentDate) : null,
            stats: campaignStatsFrom(c.statistics),
          };
        },
      ),
    /** Senders of the account, with their activation state. */
    senders: () =>
      call("GET", "/senders", 200, (json) =>
        z
          .object({
            senders: z
              .array(z.object({ email: z.string(), active: z.boolean().nullish() }))
              .nullish(),
          })
          .parse(json)
          .senders?.map((s) => ({ email: s.email.toLowerCase(), active: s.active ?? false })),
      ),
    /** Contacts on the list who can receive a campaign (blocklisted ones excluded). */
    listRecipients: (listId: number) =>
      call("GET", `/contacts/lists/${listId}`, 200, (json) => {
        const list = z.object({ totalSubscribers: count, totalBlacklisted: count }).parse(json);
        return Math.max(0, list.totalSubscribers - list.totalBlacklisted);
      }),
  };
}
