import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocument, ToComplete } from "@/features/legal/legal-document";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Livrare și retur",
  alternates: { canonical: "/livrare-si-retur" },
};

export default async function ShippingPage() {
  const { shipping, legal } = await getSettings();
  return (
    <LegalDocument
      title="Livrare și retur"
      version={legal.termsVersion}
      sections={[
        {
          id: "cost",
          title: "Costul livrării",
          body: (
            <ul>
              {shipping.methods
                .filter((m) => m.active)
                .map((m) => (
                  <li key={m.code}>
                    {m.name}: {m.price > 0 ? formatMoney(m.price) : "gratuit"}
                    {m.description ? ` — ${m.description}` : ""}
                  </li>
                ))}
              {shipping.freeShippingThreshold != null ? (
                <li>
                  Livrare gratuită pentru comenzile de peste{" "}
                  {formatMoney(shipping.freeShippingThreshold)} (după aplicarea reducerilor)
                  {shipping.methods.some((m) => m.active && !m.freeShippingEligible)
                    ? ", pentru metodele de livrare eligibile"
                    : ""}
                  .
                </li>
              ) : null}
            </ul>
          ),
        },
        {
          id: "termene",
          title: "Termene și curieri",
          body: (
            <p>
              <ToComplete>curierii folosiți, zonele de livrare și termenele estimate</ToComplete>
            </p>
          ),
        },
        {
          id: "retur",
          title: "Retururi",
          body: (
            <p>
              Condițiile complete sunt în{" "}
              <Link href="/politica-de-retur" className="text-forest underline underline-offset-2">
                Politica de retur
              </Link>
              .
            </p>
          ),
        },
      ]}
    />
  );
}
