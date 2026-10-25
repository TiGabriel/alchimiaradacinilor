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
  const { legal, contact, affiliate } = await getSettings();
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
              Contul este gratuit și îți permite să salvezi produse favorite și ritualuri, să
              păstrezi rezultatele quiz-ului și să scrii recenzii după confirmarea adresei de email.
              Ești responsabil pentru păstrarea confidențialității parolei.{" "}
              <ToComplete>condiții de suspendare/închidere a contului</ToComplete>
            </p>
          ),
        },
        {
          id: "produse",
          title: "Produse și informații",
          body: (
            <p>
              Descrierile produselor prezintă aroma și modul de folosire recomandat de producător.
              Informațiile nu reprezintă sfaturi medicale.{" "}
              <ToComplete>clauze privind acuratețea informațiilor și imaginilor</ToComplete>
            </p>
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
          title: "Soluționarea reclamațiilor",
          body: (
            <p>
              Ne poți scrie oricând la{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-forest underline underline-offset-2"
              >
                {contact.email}
              </a>
              . Informații despre protecția consumatorilor găsești pe site-ul{" "}
              <a
                href="https://anpc.ro/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest underline underline-offset-2"
              >
                ANPC
              </a>
              .{" "}
              <ToComplete>
                proceduri alternative de soluționare, legea aplicabilă, instanța competentă
              </ToComplete>
            </p>
          ),
        },
      ]}
    />
  );
}
