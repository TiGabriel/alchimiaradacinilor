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
              <li>Taxă de livrare: {formatMoney(shipping.flatFee)}.</li>
              {shipping.freeShippingThreshold != null ? (
                <li>
                  Livrare gratuită pentru comenzile de peste{" "}
                  {formatMoney(shipping.freeShippingThreshold)} (după aplicarea reducerilor).
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
