import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Sprig } from "@/components/botanical";
import { BotanicalFloat, Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";

/**
 * Pages that are linked from navigation but built in later phases. Each one
 * explains itself and offers a useful next step, so no link is a dead end.
 */
export const comingSoonPages = {
  quiz: {
    eyebrow: "Quiz aromatic",
    title: "Quiz-ul aromatic prinde rădăcini",
    description:
      "În curând vei putea răspunde la câteva întrebări simple și vei primi recomandări potrivite ție.",
  },
  rutine: {
    eyebrow: "Rutine",
    title: "Ritualuri pentru fiecare moment al zilei",
    description: "Pregătim rutine simple, pas cu pas, pentru dimineți luminoase și seri liniștite.",
  },
  jurnal: {
    eyebrow: "Jurnal",
    title: "Jurnalul nostru botanic",
    description: "Povești despre plante, arome și ritualuri — primele articole sunt în lucru.",
  },
  despre: {
    eyebrow: "Despre noi",
    title: "Povestea Alchimiei Rădăcinilor",
    description: "Scriem povestea noastră cu grijă. Revino curând să ne cunoști mai bine.",
  },
  cont: {
    eyebrow: "Contul meu",
    title: "Contul tău este în pregătire",
    description: "Autentificarea, comenzile și adresele salvate vor fi disponibile în curând.",
  },
  termeni: {
    eyebrow: "Informații legale",
    title: "Termeni și condiții",
    description:
      "Documentul este în curs de redactare și va fi publicat înainte de lansarea magazinului.",
  },
  confidentialitate: {
    eyebrow: "Informații legale",
    title: "Politica de confidențialitate",
    description:
      "Documentul este în curs de redactare și va fi publicat înainte de lansarea magazinului.",
  },
  cookies: {
    eyebrow: "Informații legale",
    title: "Politica de cookies",
    description:
      "Documentul este în curs de redactare și va fi publicat înainte de lansarea magazinului.",
  },
  livrare: {
    eyebrow: "Ajutor",
    title: "Livrare și retur",
    description:
      "Detaliile despre livrare, costuri și retururi vor fi publicate înainte de lansare.",
  },
  faq: {
    eyebrow: "Ajutor",
    title: "Întrebări frecvente",
    description: "Adunăm cele mai frecvente întrebări. Până atunci, ne poți scrie oricând.",
  },
  produse: {
    eyebrow: "Produse",
    title: "Catalogul se așază pe rafturi",
    description: "Lista completă de produse, cu filtre și sortare, este aproape gata.",
  },
  descopera: {
    eyebrow: "Descoperă",
    title: "Descoperă după nevoie sau categorie",
    description: "Ghidurile de descoperire sunt în pregătire.",
  },
  cautare: {
    eyebrow: "Căutare",
    title: "Căutarea este în pregătire",
    description: "În curând vei putea căuta rapid produse, categorii și arome.",
  },
  favorite: {
    eyebrow: "Favorite",
    title: "Favoritele tale",
    description: "Lista de favorite va fi disponibilă în curând.",
  },
  cos: {
    eyebrow: "Coș",
    title: "Coșul tău",
    description: "Coșul de cumpărături va fi disponibil în curând.",
  },
} satisfies Record<string, { eyebrow: string; title: string; description: string }>;

export type ComingSoonKey = keyof typeof comingSoonPages;

export function comingSoonMetadata(key: ComingSoonKey): Metadata {
  const page = comingSoonPages[key];
  return {
    title: page.title,
    description: page.description,
    robots: { index: false, follow: true },
  };
}

export function ComingSoon({
  page,
  children,
}: {
  page: ComingSoonKey;
  children?: React.ReactNode;
}) {
  const { eyebrow, title, description } = comingSoonPages[page];
  return (
    <section className="relative overflow-hidden">
      <BotanicalFloat className="absolute -top-6 right-[4%] hidden w-40 md:block" drift={12}>
        <Sprig className="w-full text-sage/60" />
      </BotanicalFloat>
      <div className="relative container-page flex flex-col items-start py-20 md:py-28">
        <Reveal className="flex max-w-2xl flex-col gap-5">
          <p className="text-eyebrow text-clay">{eyebrow}</p>
          <h1 className="text-display-lg">{title}</h1>
          <p className="text-lg text-ink-muted">{description}</p>
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-forest-soft px-3 py-1 text-sm font-semibold text-forest-deep">
            <span aria-hidden className="size-1.5 rounded-full bg-forest" /> Pagină în pregătire
          </p>
        </Reveal>
        {children}
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/produse">
              Descoperă produsele <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/contact">Scrie-ne</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
