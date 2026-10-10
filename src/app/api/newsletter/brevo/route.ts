import { env } from "@/lib/env";
import { brevoWebhookAuthorized, parseBrevoSuppressions } from "@/services/newsletter/brevo";
import { suppressSubscriber } from "@/services/newsletter/newsletter";

/**
 * Brevo marketing webhook: unsubscribes (from a campaign's link), spam
 * complaints and hard bounces are mirrored to the site's subscriber list, so
 * neither system emails someone the other one has suppressed.
 */
export async function POST(request: Request) {
  const secret = env().BREVO_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 404 });
  if (!brevoWebhookAuthorized(request.headers, secret)) return new Response(null, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  try {
    for (const { email, reason } of parseBrevoSuppressions(body))
      await suppressSubscriber(email, reason);
  } catch (error) {
    console.error("[newsletter] Brevo webhook failed", error);
    // A 5xx makes Brevo retry later.
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}
