import type { Metadata } from "next";

import { LegalDocument, ToComplete } from "@/features/legal/legal-document";
import { getSetting } from "@/services/settings";

export const metadata: Metadata = {
  title: "Politica de cookies",
  description: "Ce cookie-uri și ce date stocate local folosește site-ul.",
  alternates: { canonical: "/politica-cookies" },
};

const rows = [
  {
    name: "ar_session",
    kind: "Cookie (httpOnly)",
    purpose: "Te menține autentificat în cont.",
    duration: "30 de zile",
    category: "Strict necesar",
  },
  {
    name: "ar_cart",
    kind: "Cookie (httpOnly)",
    purpose: "Păstrează coșul de cumpărături pentru vizitatorii fără cont.",
    duration: "60 de zile",
    category: "Strict necesar",
  },
  {
    name: "ar:wishlist",
    kind: "Stocare locală (browser)",
    purpose: "Păstrează lista de favorite pentru vizitatorii fără cont.",
    duration: "Până la ștergere",
    category: "Funcțional",
  },
  {
    name: "ar:recent-searches",
    kind: "Stocare locală (browser)",
    purpose: "Afișează căutările tale recente.",
    duration: "Până la ștergere",
    category: "Funcțional",
  },
];

export default async function CookiePolicyPage() {
  const legal = await getSetting("legal");
  return (
    <LegalDocument
      title="Politica de cookies"
      version={legal.cookiePolicyVersion}
      sections={[
        {
          id: "ce-sunt",
          title: "Ce sunt cookie-urile",
          body: (
            <p>
              Cookie-urile sunt fișiere mici salvate de browser. Stocarea locală (localStorage)
              păstrează date doar în browserul tău și nu este trimisă automat către server.
            </p>
          ),
        },
        {
          id: "folosite",
          title: "Ce folosim în prezent",
          body: (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-ink-muted">
                  <tr>
                    <th className="px-2 py-2">Nume</th>
                    <th className="px-2 py-2">Tip</th>
                    <th className="px-2 py-2">Scop</th>
                    <th className="px-2 py-2">Durată</th>
                    <th className="px-2 py-2">Categorie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.name}>
                      <td className="px-2 py-2 font-mono text-xs">{r.name}</td>
                      <td className="px-2 py-2">{r.kind}</td>
                      <td className="px-2 py-2">{r.purpose}</td>
                      <td className="px-2 py-2">{r.duration}</td>
                      <td className="px-2 py-2">{r.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
        {
          id: "analiza",
          title: "Cookie-uri de analiză și marketing",
          body: (
            <p>
              În prezent site-ul <strong>nu</strong> folosește cookie-uri de analiză sau de
              marketing. Dacă vor fi introduse, vor fi activate doar cu acordul tău, printr-un
              banner de consimțământ.
            </p>
          ),
        },
        {
          id: "control",
          title: "Cum le controlezi",
          body: (
            <p>
              Poți șterge cookie-urile și stocarea locală din setările browserului. Fără
              cookie-urile strict necesare, autentificarea și coșul nu vor funcționa.{" "}
              <ToComplete>verificare juridică a clasificării cookie-urilor</ToComplete>
            </p>
          ),
        },
      ]}
    />
  );
}
