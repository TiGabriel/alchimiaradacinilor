import type { Metadata } from "next";

import {
  BrandForm,
  ContactForm,
  EmailSeoForm,
  HomepageForm,
  LegalTaxForm,
  PaymentForm,
  RecommendationForm,
  ShippingForm,
} from "@/features/admin/settings/settings-forms";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { db } from "@/lib/db";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Setări" };

const sections = [
  ["brand", "Brand"],
  ["contact", "Contact"],
  ["livrare", "Livrare"],
  ["plata", "Plată"],
  ["email-seo", "Email și SEO"],
  ["prima-pagina", "Prima pagină"],
  ["legal", "Legal și TVA"],
  ["recomandari", "Recomandări"],
] as const;

export default async function SettingsPage() {
  await requirePermission("settings:manage");
  const [s, products] = await Promise.all([
    getSettings(),
    db.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  return (
    <>
      <AdminPageHeader
        title="Setări"
        description="Fiecare secțiune se salvează separat și se aplică imediat în magazin."
      />
      <nav aria-label="Secțiuni setări" className="flex flex-wrap gap-2">
        {sections.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-forest hover:text-forest"
          >
            {label}
          </a>
        ))}
      </nav>
      <div id="brand" className="scroll-mt-6">
        <BrandForm initial={s.brand} />
      </div>
      <div id="contact" className="scroll-mt-6">
        <ContactForm contact={s.contact} social={s.social} />
      </div>
      <div id="livrare" className="scroll-mt-6">
        <ShippingForm initial={s.shipping} />
      </div>
      <div id="plata" className="scroll-mt-6">
        <PaymentForm initial={s.payment} />
      </div>
      <div id="email-seo" className="scroll-mt-6">
        <EmailSeoForm email={s.email} seo={s.seo} />
      </div>
      <div id="prima-pagina" className="scroll-mt-6">
        <HomepageForm initial={s.homepage} products={products} />
      </div>
      <div id="legal" className="scroll-mt-6">
        <LegalTaxForm legal={s.legal} tax={s.tax} />
      </div>
      <div id="recomandari" className="scroll-mt-6">
        <RecommendationForm initial={s.recommendation} />
      </div>
    </>
  );
}
