import type { Metadata } from "next";

import { LegalDocument, ToComplete } from "@/features/legal/legal-document";
import { getSettings } from "@/services/settings";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Politica de retur",
    description: "Dreptul de retragere în 14 zile, condițiile de retur și rambursarea.",
    path: "/politica-de-retur",
  });
}

export default async function ReturnPolicyPage() {
  const { legal, contact } = await getSettings();
  return (
    <LegalDocument
      title="Politica de retur"
      version={legal.termsVersion}
      sections={[
        {
          id: "retragere",
          title: "Dreptul de retragere",
          body: (
            <p>
              <ToComplete>
                termenul și condițiile dreptului de retragere pentru contractele la distanță,
                conform legislației în vigoare
              </ToComplete>
            </p>
          ),
        },
        {
          id: "exceptii",
          title: "Produse exceptate",
          body: (
            <p>
              <ToComplete>
                produse care nu pot fi returnate după desigilare din motive de igienă sau protecție
                a sănătății, dacă este cazul
              </ToComplete>
            </p>
          ),
        },
        {
          id: "procedura",
          title: "Cum returnezi un produs",
          body: (
            <p>
              Scrie-ne la{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-forest underline underline-offset-2"
              >
                {contact.email}
              </a>{" "}
              cu numărul comenzii.{" "}
              <ToComplete>
                pașii de retur, adresa de retur, cine suportă costul transportului
              </ToComplete>
            </p>
          ),
        },
        {
          id: "rambursare",
          title: "Rambursarea",
          body: (
            <p>
              <ToComplete>termenul și modalitatea de rambursare</ToComplete>
            </p>
          ),
        },
        {
          id: "neconforme",
          title: "Produse deteriorate sau neconforme",
          body: (
            <p>
              <ToComplete>procedura pentru produse primite deteriorate sau greșite</ToComplete>
            </p>
          ),
        },
      ]}
    />
  );
}
