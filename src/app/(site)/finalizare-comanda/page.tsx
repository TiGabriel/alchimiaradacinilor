import { MailCheck, ShoppingBag } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ResendVerificationForm } from "@/features/auth/components/resend-verification";
import { requireUser } from "@/features/auth/session";
import { CheckoutFlow } from "@/features/checkout/checkout-flow";
import { listAddresses } from "@/services/account/addresses";
import { loadCartView } from "@/services/cart/cart";
import { activeShippingMethods } from "@/services/checkout/pricing";
import { availablePaymentOptions } from "@/services/payments/methods";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Finalizează comanda",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const { user } = await requireUser("/finalizare-comanda");

  const header = (
    <>
      <div className="pt-6 md:pt-8">
        <Breadcrumbs items={[{ label: "Coș", href: "/cos" }, { label: "Finalizare comandă" }]} />
      </div>
      <h1 className="py-8 text-display-lg md:py-10">Finalizează comanda</h1>
    </>
  );

  if (!user.emailVerified) {
    return (
      <div className="container-page pb-(--spacing-section)">
        {header}
        <EmptyState
          className="mx-0 max-w-2xl rounded-xl border border-line bg-surface"
          illustration={
            <div className="grid size-full place-items-center rounded-full bg-forest-soft text-forest">
              <MailCheck aria-hidden className="size-1/3" />
            </div>
          }
          title="Confirmă adresa de email pentru a plasa comanda"
          description={`Folosește linkul de confirmare trimis la ${user.email} sau cere unul nou mai jos. După confirmare, revino aici — coșul tău rămâne salvat.`}
          actions={<ResendVerificationForm compact />}
        />
      </div>
    );
  }

  const [cart, addresses, settings] = await Promise.all([
    loadCartView({ userId: user.id, token: null }),
    listAddresses(user.id),
    getSettings(),
  ]);

  if (cart.lines.length === 0) {
    return (
      <div className="container-page pb-(--spacing-section)">
        {header}
        <EmptyState
          className="mx-0 max-w-2xl rounded-xl border border-line bg-surface"
          illustration={
            <div className="grid size-full place-items-center rounded-full bg-forest-soft text-forest">
              <ShoppingBag aria-hidden className="size-1/3" />
            </div>
          }
          title="Coșul tău este gol"
          description="Adaugă produsele preferate în coș, apoi revino aici pentru a finaliza comanda."
          actions={
            <Button asChild>
              <Link href="/produse">Descoperă produsele</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page pb-(--spacing-section)">
      {header}
      <CheckoutFlow
        initialCart={cart}
        addresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          firstName: a.firstName,
          lastName: a.lastName,
          phone: a.phone,
          street: a.street,
          streetExtra: a.streetExtra,
          city: a.city,
          county: a.county,
          postalCode: a.postalCode,
          companyName: a.companyName,
          isDefaultShipping: a.isDefaultShipping,
          isDefaultBilling: a.isDefaultBilling,
        }))}
        methods={activeShippingMethods(settings.shipping)}
        freeShippingThreshold={settings.shipping.freeShippingThreshold}
        paymentOptions={availablePaymentOptions(settings.payment)}
        customer={{ firstName: user.firstName, lastName: user.lastName, email: user.email }}
      />
    </div>
  );
}
