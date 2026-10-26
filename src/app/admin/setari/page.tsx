import type { Metadata } from "next";
import Link from "next/link";

import {
  AffiliateForm,
  BrandForm,
  ContactForm,
  EmailSeoForm,
  HomepageForm,
  LegalForm,
  RecommendationForm,
} from "@/features/admin/settings/settings-forms";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { db } from "@/lib/db";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = { title: "Setări" };

const sections = [
  ["brand", "Brand"],
  ["contact", "Contact"],
  ["email-seo", "Email și SEO"],
  ["prima-pagina", "Prima pagină"],
  ["legal", "Date legale"],
  ["recomandari", "Recomandări"],
  ["linkuri", "Linkuri doTERRA"],
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
        description="Fiecare secțiune se salvează separat și se aplică imediat pe site."
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
        <Link
          href="/admin/setari/culori"
          className="rounded-full border border-forest bg-forest-soft px-3 py-1.5 text-sm font-semibold text-forest-deep hover:bg-sage-soft"
        >
          Culori site →
        </Link>
      </nav>
      <div id="brand" className="scroll-mt-6">
        <BrandForm initial={s.brand} />
      </div>
      <div id="contact" className="scroll-mt-6">
        <ContactForm contact={s.contact} social={s.social} />
      </div>
      <div id="email-seo" className="scroll-mt-6">
        <EmailSeoForm email={s.email} seo={s.seo} />
      </div>
      <div id="prima-pagina" className="scroll-mt-6">
        <HomepageForm initial={s.homepage} products={products} />
      </div>
      <div id="legal" className="scroll-mt-6">
        <LegalForm legal={s.legal} />
      </div>
      <div id="recomandari" className="scroll-mt-6">
        <RecommendationForm initial={s.recommendation} />
      </div>
      <div id="linkuri" className="scroll-mt-6">
        <AffiliateForm initial={s.affiliate} />
      </div>
    </>
  );
}
