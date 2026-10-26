import type { Metadata } from "next";
import Link from "next/link";

import { CompanyDetails } from "@/features/legal/company";
import { LegalDocument, ToComplete } from "@/features/legal/legal-document";
import { getSettings } from "@/services/settings";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Termeni și condiții",
    description: "Condițiile de utilizare a site-ului Alchimia Rădăcinilor.",
    path: "/termeni-si-conditii",
  });
}

export default async function TermsPage() {
  const { legal, contact, affiliate, brand } = await getSettings();
  return (
    <LegalDocument
      title="Termeni și condiții"
      version={legal.termsVersion}
      sections={[
        {
          id: "operator",
          title: "Operatorul site-ului",
          body: <CompanyDetails legal={legal} email={contact.email} />,
        },
        {
          id: "cont",
          title: "Contul de membru",
          body: (
            <p>
              Contul este gratuit și îți permite să salvezi produse și ritualuri, să păstrezi
              rezultatele quiz-ului și să scrii recenzii după confirmarea adresei de email. Ești
              responsabil pentru păstrarea confidențialității parolei.{" "}
              <ToComplete>condiții de suspendare/închidere a contului</ToComplete>
            </p>
          ),
        },
        {
          id: "continut",
          title: "Conținutul site-ului",
          body: (
            <>
              <p>
                Articolele, ritualurile, recenziile și descrierile de produs au scop informativ.
                Descriem aroma, atmosfera și momentele în care folosim produsele; informațiile nu
                reprezintă sfaturi medicale și nu înlocuiesc consultul unui specialist. Pentru
                instrucțiunile de folosire și siguranță, ține cont de eticheta produsului și de
                informațiile doTERRA.
              </p>
              <p>
                <ToComplete>clauze privind acuratețea informațiilor și imaginilor</ToComplete>
              </p>
            </>
          ),
        },
        {
          id: "recenzii",
          title: "Recenziile membrilor",
          body: (
            <>
              <p>
                Membrii cu adresa de email confirmată pot scrie câte o recenzie pentru fiecare
                produs. Citim fiecare recenzie înainte de publicare și nu publicăm texte jignitoare,
                publicitate, date personale ale altor persoane sau afirmații că un produs tratează
                ori vindecă o afecțiune. Lângă recenzie apar prenumele tău și inițiala numelui.
              </p>
              <p>
                <ToComplete>
                  dreptul de a folosi textul și fotografia recenziei, retragerea unei recenzii
                </ToComplete>
              </p>
            </>
          ),
        },
        {
          id: "cumparare",
          title: "Cumpărarea produselor",
          body: (
            <>
              <p>
                Nu vindem produse pe acest site. Produsele despre care scriem se cumpără de pe
                site-ul oficial doTERRA, iar comanda, plata, livrarea și returul se fac după
                condițiile doTERRA. Detalii în{" "}
                <Link href="/cum-cumpar" className="text-forest underline underline-offset-2">
                  Cum cumpăr
                </Link>
                .
              </p>
              <p>{affiliate.disclosureLong}</p>
            </>
          ),
        },
        {
          id: "preturi",
          title: "Prețuri",
          body: (
            <p>
              Prețurile sunt afișate în lei (RON) cu titlu informativ și sunt cele de pe site-ul
              doTERRA. Prețul valabil este cel afișat de doTERRA în momentul comenzii.{" "}
              <ToComplete>condiții privind erorile de afișare</ToComplete>
            </p>
          ),
        },
        {
          id: "linkuri",
          title: "Linkuri către alte site-uri",
          body: (
            <p>
              Site-ul conține linkuri către site-ul doTERRA și, uneori, către alte site-uri. Nu
              răspundem pentru conținutul, prețurile sau politicile acestora.
            </p>
          ),
        },
        {
          id: "proprietate",
          title: "Proprietate intelectuală",
          body: (
            <p>
              Textele, fotografiile proprii și grafica site-ului aparțin {brand.siteName}. doTERRA
              și denumirile produselor sunt mărci ale proprietarilor lor.{" "}
              <ToComplete>
                condițiile de folosire a fotografiilor de produs și a mărcii doTERRA
              </ToComplete>
            </p>
          ),
        },
        {
          id: "raspundere",
          title: "Răspundere și garanții",
          body: (
            <p>
              <ToComplete>limitarea răspunderii pentru conținutul site-ului</ToComplete>
            </p>
          ),
        },
        {
          id: "litigii",
          title: "Contact și reclamații",
          body: (
            <p>
              Ne poți scrie oricând la{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-forest underline underline-offset-2"
              >
                {contact.email}
              </a>
              .{" "}
              <ToComplete>
                legea aplicabilă, instanța competentă; dacă mai este nevoie de linkul ANPC, acum că
                site-ul nu vinde
              </ToComplete>
            </p>
          ),
        },
      ]}
    />
  );
}
