import { hashIp } from "@/services/auth/tokens";
import { unsubscribeWithSignature } from "@/services/newsletter/newsletter";
import { env } from "@/lib/env";
import { clientIp } from "@/lib/request";

/**
 * RFC 8058 one-click unsubscribe (List-Unsubscribe-Post). Mail clients POST
 * here directly; the signed link identifies the subscriber.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const outcome = await unsubscribeWithSignature(
    url.searchParams.get("s") ?? "",
    url.searchParams.get("t") ?? "",
    {
      source: "list-unsubscribe",
      ipHash: hashIp(clientIp(request.headers), env().AUTH_SECRET ?? "dev-only-salt"),
      userAgent: request.headers.get("user-agent"),
    },
  );
  return new Response(null, { status: outcome === "invalid" ? 400 : 204 });
}
