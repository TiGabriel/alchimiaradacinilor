import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { NewsletterToggle, PersonalizationToggle } from "@/features/account/profile-forms";
import { AccountCard, AccountHeader } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { getNewsletterState, getUserConsents } from "@/services/consent/consent";

export const metadata: Metadata = {
  title: "Preferințe newsletter",
  robots: { index: false, follow: false },
};

const purposeLabels: Record<string, string> = {
  PRIVACY_POLICY: "Prelucrarea datelor (Politica de confidențialitate)",
  NEWSLETTER: "Emailuri de marketing (newsletter, oferte, recomandări, reduceri)",
  PERSONALIZATION: "Recomandări personalizate pe baza activității din cont",
  TERMS: "Termeni și condiții",
  ANALYTICS: "Cookie-uri de analiză",
  MARKETING: "Cookie-uri de marketing",
  NECESSARY: "Cookie-uri necesare",
};

const dateTime = new Intl.DateTimeFormat("ro-RO", { dateStyle: "long", timeStyle: "short" });

export default async function NewsletterPage() {
  const { user } = await requireUser("/cont/newsletter");
  const [newsletter, { records, latest }] = await Promise.all([
    getNewsletterState(user.id),
    getUserConsents(user.id),
  ]);
  const personalization = latest.get("PERSONALIZATION")?.granted ?? false;

  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Preferințe newsletter"
        description="Tu decizi ce primești de la noi. Orice schimbare este înregistrată și se aplică imediat."
      />

      <AccountCard
        title="Emailuri de marketing"
        action={
          <Badge
            variant={
              newsletter.subscribed
                ? "success"
                : newsletter.status === "PENDING"
                  ? "warning"
                  : "neutral"
            }
          >
            {newsletter.subscribed
              ? "Abonat"
              : newsletter.status === "PENDING"
                ? "În așteptarea confirmării"
                : "Neabonat"}
          </Badge>
        }
      >
        <p className="text-ink-muted">
          Newslettere, oferte speciale, recomandări personalizate și reduceri pe email.
          {newsletter.consentedAt
            ? ` Consimțământ acordat pe ${dateTime.format(newsletter.consentedAt)}.`
            : ""}
          {newsletter.withdrawnAt
            ? ` Consimțământ retras pe ${dateTime.format(newsletter.withdrawnAt)}.`
            : ""}
        </p>
        {newsletter.status === "PENDING" ? (
          <p className="text-sm text-warning">
            Abonarea devine activă după ce îți confirmi adresa de email.
          </p>
        ) : null}
        <NewsletterToggle subscribed={newsletter.subscribed || newsletter.status === "PENDING"} />
      </AccountCard>

      <AccountCard
        title="Recomandări personalizate"
        action={
          <Badge variant={personalization ? "success" : "neutral"}>
            {personalization ? "Activate" : "Dezactivate"}
          </Badge>
        }
      >
        <p className="text-ink-muted">
          Cu acordul tău, recomandările din site țin cont de favoritele, rutinele salvate și
          comenzile tale. Fără acord, folosim doar ce alegi în quiz sau pe pagini.
        </p>
        <PersonalizationToggle granted={personalization} />
      </AccountCard>

      <AccountCard title="Istoricul consimțămintelor">
        {records.length ? (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-ink-muted">
                <tr>
                  <th className="px-2 py-2 font-semibold">Data</th>
                  <th className="px-2 py-2 font-semibold">Scop</th>
                  <th className="px-2 py-2 font-semibold">Stare</th>
                  <th className="px-2 py-2 font-semibold">Versiune politică</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...records].reverse().map((r, i) => (
                  <tr key={i}>
                    <td className="px-2 py-2 whitespace-nowrap">{dateTime.format(r.createdAt)}</td>
                    <td className="px-2 py-2">{purposeLabels[r.purpose] ?? r.purpose}</td>
                    <td className="px-2 py-2">{r.granted ? "Acordat" : "Retras"}</td>
                    <td className="px-2 py-2 font-mono text-xs">{r.policyVersion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-ink-muted">Nu există înregistrări.</p>
        )}
        <p className="text-xs text-ink-muted">
          Detalii despre cum folosim datele găsești în{" "}
          <Link href="/politica-de-confidentialitate" className="underline underline-offset-2">
            Politica de confidențialitate
          </Link>
          .
        </p>
      </AccountCard>
    </div>
  );
}
