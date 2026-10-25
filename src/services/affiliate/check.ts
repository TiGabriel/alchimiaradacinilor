import "server-only";

import { isAllowedReferralUrl } from "./links";

export type LinkCheckResult = {
  /** UNKNOWN: doTERRA did not give a clear answer (blocked, slow, other host); status unchanged. */
  status: "OK" | "BROKEN" | "UNKNOWN";
  message: string;
};

const MAX_REDIRECTS = 5;

/**
 * Opens a referral link from the server the way a browser would, following redirects by hand so
 * that every hop is checked against the allowed doTERRA domains (never fetches anything else).
 */
export async function testReferralLink(
  url: string,
  allowedHosts: readonly string[],
  fetcher: typeof fetch = fetch,
): Promise<LinkCheckResult> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!isAllowedReferralUrl(current, allowedHosts))
      return hop === 0
        ? { status: "BROKEN", message: "Linkul nu este pe un domeniu doTERRA permis." }
        : {
            status: "UNKNOWN",
            message: `Linkul redirecționează către ${new URL(current).hostname}. Verifică-l manual.`,
          };
    let response: Response;
    try {
      response = await fetcher(current, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: {
          Accept: "text/html",
          "User-Agent": "Mozilla/5.0 (AlchimiaRadacinilor link check)",
        },
      });
    } catch {
      return { status: "UNKNOWN", message: "doTERRA nu a răspuns. Încearcă din nou mai târziu." };
    }
    await response.body?.cancel().catch(() => {});

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location)
        return { status: "BROKEN", message: "Linkul redirecționează fără destinație." };
      current = new URL(location, current).toString();
      continue;
    }
    if (response.ok) return { status: "OK", message: "Linkul funcționează." };
    if (response.status === 404 || response.status === 410)
      return { status: "BROKEN", message: `Pagina nu mai există pe doTERRA (${response.status}).` };
    return {
      status: "UNKNOWN",
      message: `doTERRA a răspuns cu codul ${response.status}. Deschide linkul și verifică-l manual.`,
    };
  }
  return { status: "BROKEN", message: "Linkul are prea multe redirecționări." };
}
