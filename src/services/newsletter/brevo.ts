/**
 * Brevo contacts API (email marketing) over plain HTTP — no SDK. Pure: the
 * caller passes the credentials and, in tests, a fake `fetch`.
 *
 * The site's database stays the source of truth for consent. Brevo only
 * receives confirmed subscribers (one list) and withdrawals; designed campaigns
 * are sent to that list through `brevo-campaigns.ts`.
 */
import { createHash, timingSafeEqual } from "node:crypto";

import { z } from "zod";

export type MarketingContact = {
  email: string;
  firstName?: string | null;
  /** Where the subscription started (footer, cont, inregistrare…). */
  source?: string | null;
  confirmedAt?: Date | null;
};

export type SyncResult = { ok: true } | { ok: false; error: string };

export interface MarketingProvider {
  readonly name: string;
  /**
   * Adds a confirmed subscriber to the list. `freshConsent` is true only right
   * after the person confirmed (double opt-in or a signed-in opt-in); only then
   * is an earlier Brevo-side blocklisting lifted. Reconciliation never does.
   */
  subscribe(contact: MarketingContact, options?: { freshConsent?: boolean }): Promise<SyncResult>;
  /** Removes the contact from the list and blocklists it for marketing email. */
  unsubscribe(email: string): Promise<SyncResult>;
}

const API = "https://api.brevo.com/v3";

/** Contact attributes we send. They must exist in Brevo (Contacts → Settings → Attributes). */
export function brevoAttributes(contact: MarketingContact): Record<string, string> {
  const attributes: Record<string, string> = {};
  if (contact.firstName) attributes.FIRSTNAME = contact.firstName;
  if (contact.source) attributes.SURSA_ABONARE = contact.source;
  if (contact.confirmedAt) attributes.DATA_ABONARE = contact.confirmedAt.toISOString().slice(0, 10);
  return attributes;
}

export function brevoProvider(config: {
  apiKey: string;
  listId: number;
  fetch?: typeof fetch;
  timeoutMs?: number;
}): MarketingProvider {
  const doFetch = config.fetch ?? fetch;
  const timeoutMs = config.timeoutMs ?? 4000;

  async function call(method: "POST" | "PUT", path: string, body: unknown) {
    return doFetch(`${API}${path}`, {
      method,
      headers: {
        "api-key": config.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  async function failure(res: Response): Promise<SyncResult> {
    return { ok: false, error: `Brevo ${res.status}: ${(await res.text()).slice(0, 300)}` };
  }

  return {
    name: "brevo",
    async subscribe(contact, options) {
      try {
        const attributes = brevoAttributes(contact);
        const body = {
          email: contact.email,
          listIds: [config.listId],
          updateEnabled: true,
          ...(options?.freshConsent ? { emailBlacklisted: false } : {}),
        };
        let res = await call("POST", "/contacts", { ...body, attributes });
        // Attributes that were not created in Brevo make the whole call fail: keep the
        // subscription (it matters more) and report the missing attributes in the logs.
        if (res.status === 400 && Object.keys(attributes).length > 0) {
          console.warn(
            `[brevo] contact rejected with attributes (${Object.keys(attributes).join(", ")}); retrying without them:`,
            (await res.text()).slice(0, 300),
          );
          res = await call("POST", "/contacts", body);
        }
        // 201 = created, 204 = existing contact updated.
        return res.ok ? { ok: true } : await failure(res);
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
    async unsubscribe(email) {
      try {
        const res = await call(
          "PUT",
          `/contacts/${encodeURIComponent(email)}?identifierType=email_id`,
          { emailBlacklisted: true, unlinkListIds: [config.listId] },
        );
        // 404: never synced to Brevo, so there is nothing to withdraw there.
        return res.ok || res.status === 404 ? { ok: true } : await failure(res);
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) };
      }
    },
  };
}

// ── Webhook ────────────────────────────────────────────────────────────────

/** Brevo events that end marketing email to an address, normalised. */
export type SuppressionReason = "unsubscribe" | "spam" | "hard_bounce";

const SUPPRESSION_EVENTS = new Map<string, SuppressionReason>([
  // Payload names, and the camelCase names used when the webhook is configured.
  ["unsubscribe", "unsubscribe"],
  ["unsubscribed", "unsubscribe"],
  ["spam", "spam"],
  ["hard_bounce", "hard_bounce"],
  ["hardBounce", "hard_bounce"],
]);

const webhookEventSchema = z.object({
  event: z.string(),
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});

/**
 * Extracts suppressions from a marketing webhook body (one event or a batched
 * array). Other events (opens, clicks, deliveries…) and malformed entries are ignored.
 */
export function parseBrevoSuppressions(
  body: unknown,
): Array<{ email: string; reason: SuppressionReason }> {
  const events = Array.isArray(body) ? body : [body];
  const out: Array<{ email: string; reason: SuppressionReason }> = [];
  for (const raw of events) {
    const parsed = webhookEventSchema.safeParse(raw);
    if (!parsed.success) continue;
    const reason = SUPPRESSION_EVENTS.get(parsed.data.event);
    if (reason) out.push({ email: parsed.data.email, reason });
  }
  return out;
}

/**
 * True when the webhook carries the shared secret, either as a custom header
 * (`X-Webhook-Secret`) or as a bearer token. Constant-time comparison.
 */
export function brevoWebhookAuthorized(headers: Headers, secret: string): boolean {
  const bearer = headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
  const given = headers.get("x-webhook-secret") ?? bearer ?? "";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(secret).digest();
  return given.length > 0 && timingSafeEqual(a, b);
}
