import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";

import { Leaf } from "@/components/botanical";
import { FacebookIcon } from "@/components/icons/facebook";
import { Reveal } from "@/components/motion";
import { Card } from "@/components/ui/card";
import { getSettings } from "@/services/settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Scrie-ne pentru orice întrebare despre produse, comenzi sau ritualuri.",
};

export default async function ContactPage() {
  const { contact, social, brand } = await getSettings();

  const rows = [
    { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.phone
      ? {
          icon: Phone,
          label: "Telefon",
          value: contact.phone,
          href: `tel:${contact.phone.replace(/\s/g, "")}`,
        }
      : null,
    contact.address ? { icon: MapPin, label: "Adresă", value: contact.address } : null,
    contact.hours ? { icon: Clock, label: "Program", value: contact.hours } : null,
  ].filter((row) => row !== null);

  return (
    <section className="container-page grid gap-12 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
      <Reveal className="flex flex-col gap-5">
        <p className="text-eyebrow text-clay">Contact</p>
        <h1 className="text-display-lg">Hai să vorbim</h1>
        <p className="max-w-md text-lg text-ink-muted">
          Ai o întrebare despre un produs, o comandă sau vrei un sfat pentru rutina ta? Scrie-ne și
          îți răspundem cât de repede putem.
        </p>
        <Leaf className="mt-4 size-16 text-sage" />
      </Reveal>
      <Reveal delay={0.1}>
        <Card className="divide-y divide-line">
          {rows.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-4 p-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-forest-soft text-forest">
                <Icon aria-hidden className="size-5" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-sm text-ink-muted">{label}</span>
                {href ? (
                  <a href={href} className="font-semibold break-words text-ink hover:text-forest">
                    {value}
                  </a>
                ) : (
                  <span className="font-semibold text-ink">{value}</span>
                )}
              </div>
            </div>
          ))}
          {social.facebookUrl ? (
            <div className="flex items-center gap-4 p-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-forest-soft text-forest">
                <FacebookIcon className="size-5" />
              </span>
              <a
                href={social.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-ink hover:text-forest"
              >
                {brand.siteName} pe Facebook
              </a>
            </div>
          ) : null}
          <p className="p-6 text-sm text-ink-muted">
            Formularul de contact va fi disponibil în curând. Până atunci, emailul este cea mai
            rapidă cale.
          </p>
        </Card>
      </Reveal>
    </section>
  );
}
