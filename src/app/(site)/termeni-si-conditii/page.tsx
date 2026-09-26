import type { Metadata } from "next";
import Link from "next/link";

import { CompanyDetails } from "@/features/legal/company";
import { LegalDocument, ToComplete } from "@/features/legal/legal-document";
import { getSettings } from "@/services/settings";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Termeni și condiții",
    description: "Condițiile de utilizare a site-ului și de vânzare pe Alchimia Rădăcinilor.",
    path: "/termeni-si-conditii",
  });
}

export default async function TermsPage() {
  const { legal, contact } = await getSettings();
  return (
    <LegalDocument
      title="Termeni și condiții"
      version={legal.termsVersion}
      sections={[
        {
          id: "operator",
          title: "Operatorul magazinului",
          body: <CompanyDetails legal={legal} email={contact.email} />,
        },
        {
          id: "cont",
          title: "Contul de client",
          body: (
            <p>
              Poți cumpăra după crearea unui cont și confirmarea adresei de email. Ești responsabil
              pentru păstrarea confidențialității parolei.{" "}
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
              Informațiile nu reprezintă sfaturi medicale. Produsele marcate „demonstrativ” nu sunt
              disponibile pentru vânzare.{" "}
              <ToComplete>clauze privind acuratețea informațiilor și imaginilor</ToComplete>
            </p>
          ),
        },
        {
          id: "preturi",
          title: "Prețuri",
          body: (
            <p>
              Prețurile sunt afișate în lei (RON) și includ TVA. Costul livrării este afișat în coș
              înainte de finalizarea comenzii.{" "}
              <ToComplete>condiții privind modificarea prețurilor și erorile de afișare</ToComplete>
            </p>
          ),
        },
        {
          id: "comenzi",
          title: "Comenzi și plată",
          body: (
            <p>
              <ToComplete>
                încheierea contractului, confirmarea comenzii, metodele de plată
              </ToComplete>
            </p>
          ),
        },
        {
          id: "livrare",
          title: "Livrare",
          body: (
            <p>
              Detalii în{" "}
              <Link href="/livrare-si-retur" className="text-forest underline underline-offset-2">
                Livrare și retur
              </Link>
              . <ToComplete>termene și condiții de livrare</ToComplete>
            </p>
          ),
        },
        {
          id: "retur",
          title: "Dreptul de retragere și retur",
          body: (
            <p>
              Detalii în{" "}
              <Link href="/politica-de-retur" className="text-forest underline underline-offset-2">
                Politica de retur
              </Link>
              .
            </p>
          ),
        },
        {
          id: "raspundere",
          title: "Răspundere și garanții",
          body: (
            <p>
              <ToComplete>garanția de conformitate, limitarea răspunderii</ToComplete>
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
