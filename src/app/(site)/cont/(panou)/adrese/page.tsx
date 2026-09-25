import type { Metadata } from "next";

import { AddressManager } from "@/features/account/address-manager";
import { AccountHeader } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { listAddresses } from "@/services/account/addresses";

export const metadata: Metadata = { title: "Adrese", robots: { index: false, follow: false } };

export default async function AddressesPage() {
  const { user } = await requireUser("/cont/adrese");
  const addresses = await listAddresses(user.id);
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Adrese"
        description="Adresele de livrare și facturare salvate în contul tău."
      />
      <AddressManager addresses={addresses} />
    </div>
  );
}
