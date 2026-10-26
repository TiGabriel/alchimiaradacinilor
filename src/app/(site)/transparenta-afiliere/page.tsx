import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocument, ToComplete } from "@/features/legal/legal-document";
import { getSettings } from "@/services/settings";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Transparență afiliere",
    description:
      "Cum funcționează linkurile de recomandare către doTERRA și ce înseamnă ele pentru tine.",
    path: "/transparenta-afiliere",
  });
}

const link = "text-forest underline underline-offset-2";

export default async function AffiliateDisclosurePage() {
  const { legal, affiliate, brand } = await getSettings();
  return (
    <LegalDocument
      title="Transparență afiliere"
      version={legal.termsVersion}
      intro={
        <p>
          {brand.siteName} nu vinde produse. Scriem despre uleiuri esențiale și ritualuri, iar
          produsele despre care scriem le cumperi direct de pe site-ul oficial doTERRA.
        </p>
      }
      sections={[
        {
          id: "linkuri",
          title: "Ce sunt linkurile de recomandare",
          body: (
            <>
              <p>{affiliate.disclosureLong}</p>
              <p>
                Le recunoști după butonul „Cumpără de pe doTERRA”, care deschide produsul într-o
                filă nouă, pe site-ul doTERRA. Lângă fiecare buton scrie că este un link de
                recomandare.
              </p>
            </>
          ),
        },
        {
          id: "relatia",
          title: "Relația noastră cu doTERRA",
          body: (
            <p>
              Primim de la doTERRA o recompensă pentru cumpărăturile făcute prin linkurile noastre.
              Nu suntem doTERRA și nu vorbim în numele companiei: comanda, plata, livrarea și
              returul se fac după condițiile doTERRA.{" "}
              <ToComplete>statutul exact față de doTERRA (de ex. Wellness Advocate)</ToComplete>
            </p>
          ),
        },
        {
          id: "pret",
          title: "Ce înseamnă pentru tine",
          body: (
            <ul>
              <li>
                Prețul și condițiile de cumpărare sunt aceleași ca atunci când intri direct pe
                doTERRA.
              </li>
              <li>
                Prețurile afișate la noi sunt cele de pe site-ul doTERRA, cu data la care le-am
                verificat. Prețul valabil este cel afișat de doTERRA în momentul comenzii.
              </li>
              <li>
                Nu ești obligat să folosești linkurile noastre ca să citești sau să folosești
                site-ul.
              </li>
            </ul>
          ),
        },
        {
          id: "independenta",
          title: "Cum alegem despre ce scriem",
          body: (
            <p>
              Scriem despre produsele pe care le folosim și le recomandăm din experiența noastră.
              Recenziile membrilor apar așa cum au fost scrise, după moderare, indiferent de notă.
              Nu descriem produsele ca tratamente și nu promitem efecte asupra sănătății.{" "}
              <ToComplete>confirmarea principiilor editoriale de către proprietar</ToComplete>
            </p>
          ),
        },
        {
          id: "date",
          title: "Ce date folosim",
          body: (
            <p>
              Numărăm de câte ori este apăsat fiecare buton „Cumpără de pe doTERRA”, pe zile și pe
              locul din site. Nu păstrăm cine a apăsat și nu folosim cookie-uri pentru asta. Ce se
              întâmplă după ce ajungi pe site-ul doTERRA ține de politica lor de confidențialitate.
              Detalii în{" "}
              <Link href="/politica-de-confidentialitate" className={link}>
                Politica de confidențialitate
              </Link>
              .
            </p>
          ),
        },
        {
          id: "intrebari",
          title: "Mai multe despre cumpărare",
          body: (
            <p>
              Pașii, pe scurt, sunt în{" "}
              <Link href="/cum-cumpar" className={link}>
                Cum cumpăr
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
