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
    name: "ar_quiz",
    kind: "Cookie (httpOnly)",
    purpose: "Îți permite să revezi rezultatul quiz-ului aromatic fără cont.",
    duration: "6 luni",
    category: "Strict necesar",
  },
  {
    name: "ar_consent",
    kind: "Cookie",
    purpose:
      "Reține alegerea ta despre cookie-uri. Dacă accepți analiza, conține și un identificator aleator folosit doar pentru statistici.",
    duration: "12 luni",
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
          title: "Analiză și marketing",
          body: (
            <>
              <p>
                <strong>Analiză (doar cu acordul tău).</strong> Dacă accepți, înregistrăm anonim
                câteva evenimente — produse vizualizate, căutări, adăugări în coș, începerea și
                finalizarea unei comenzi — împreună cu un identificator aleator. Datele rămân pe
                serverele noastre, nu includ adresa IP, numele sau emailul tău și nu sunt legate de
                contul tău. Nu folosim servicii de analiză ale unor terți.
              </p>
              <p>
                <strong>Marketing.</strong> Momentan nu folosim cookie-uri de marketing sau reclame
                pe alte site-uri. Dacă vom introduce astfel de servicii, vor funcționa doar cu
                acordul tău.
              </p>
            </>
          ),
        },
        {
          id: "control",
          title: "Cum le controlezi",
          body: (
            <p>
              Îți poți schimba oricând alegerea din linkul „Setări cookie” din subsolul fiecărei
              pagini. Poți șterge cookie-urile și stocarea locală și din setările browserului. Fără
              cookie-urile strict necesare, autentificarea și coșul nu vor funcționa.{" "}
              <ToComplete>verificare juridică a clasificării cookie-urilor</ToComplete>
            </p>
          ),
        },
      ]}
    />
  );
}
