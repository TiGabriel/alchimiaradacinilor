import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Roots } from "@/components/botanical";
import { FacebookIcon } from "@/components/icons/facebook";
import { CookieSettingsButton } from "@/features/consent/consent-context";
import { getSettings } from "@/services/settings";

import { aboutLinks, exploreLinks, legalLinks, NEWSLETTER_ANCHOR } from "../nav-config";

import { NewsletterForm } from "./newsletter-form";

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-eyebrow font-sans text-ink-inverse/70">{title}</h2>
      <ul className="flex flex-col gap-2.5 text-[0.9375rem]">{children}</ul>
    </div>
  );
}

const footerLink =
  "text-ink-inverse/90 transition-colors hover:text-ink-inverse hover:underline underline-offset-4";

export async function SiteFooter() {
  const { brand, contact, social } = await getSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden bg-forest-deep text-ink-inverse">
      <Roots className="pointer-events-none absolute -top-2 left-1/2 w-[40rem] max-w-none -translate-x-1/2 text-ink-inverse/[0.07]" />

      <div className="relative container-page grid gap-12 py-16 lg:grid-cols-[1.2fr_2fr] lg:gap-16 lg:py-20">
        <div className="flex flex-col gap-6">
          <Logo brand={brand} tone="inverse" />
          <p className="max-w-sm text-ink-inverse/80">{brand.tagline}</p>
          {/* Target of every "Abonează-te" link (header, mobile menu). */}
          <div id={NEWSLETTER_ANCHOR} className="flex max-w-sm scroll-mt-28 flex-col gap-3">
            <p className="font-display text-xl text-ink-inverse">
              Scrisori botanice, o dată pe lună
            </p>
            <p className="text-sm text-ink-inverse/75">
              Articole noi din jurnal, recenzii și ritualul lunii.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:gap-8">
          <Column title="Explorează">
            {exploreLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={footerLink}>
                  {l.label}
                </Link>
              </li>
            ))}
          </Column>
          <Column title="Despre">
            {aboutLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className={footerLink}>
                  {l.label}
                </Link>
              </li>
            ))}
          </Column>
          <Column title="Contact">
            <li>
              <a
                href={`mailto:${contact.email}`}
                className={`${footerLink} inline-flex items-start gap-2`}
              >
                <Mail aria-hidden className="mt-1 size-4 shrink-0" />
                <span>
                  {contact.email.split("@")[0]}@<wbr />
                  {contact.email.split("@")[1]}
                </span>
              </a>
            </li>
            {contact.phone ? (
              <li>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className={`${footerLink} inline-flex items-center gap-2`}
                >
                  <Phone aria-hidden className="size-4 shrink-0" /> {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li className="inline-flex items-start gap-2 text-ink-inverse/90">
                <MapPin aria-hidden className="mt-1 size-4 shrink-0" /> {contact.address}
              </li>
            ) : null}
            {contact.hours ? (
              <li className="inline-flex items-start gap-2 text-ink-inverse/90">
                <Clock aria-hidden className="mt-1 size-4 shrink-0" /> {contact.hours}
              </li>
            ) : null}
            {social.facebookUrl ? (
              <li>
                <a
                  href={social.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex size-10 items-center justify-center rounded-full bg-ink-inverse/10 transition-colors hover:bg-ink-inverse/20"
                  aria-label={`${brand.siteName} pe Facebook (se deschide într-o filă nouă)`}
                >
                  <FacebookIcon className="size-5" />
                </a>
              </li>
            ) : null}
          </Column>
        </div>
      </div>

      <div className="relative border-t border-ink-inverse/15">
        <div className="container-page flex flex-col gap-4 py-6 pb-24 text-sm text-ink-inverse/70 lg:pb-6">
          <p className="text-ink-inverse/85">
            Nu vindem produse. Linkurile către doTERRA sunt linkuri de recomandare.{" "}
            <Link
              href="/transparenta-afiliere"
              className="underline underline-offset-4 hover:text-ink-inverse"
            >
              Ce înseamnă asta
            </Link>
          </p>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p>
              © {year} {brand.siteName}. Toate drepturile rezervate.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="underline-offset-4 hover:text-ink-inverse hover:underline"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton className="cursor-pointer underline-offset-4 hover:text-ink-inverse hover:underline" />
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
