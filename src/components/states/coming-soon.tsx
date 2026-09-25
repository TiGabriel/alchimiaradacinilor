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
  faq: {
    eyebrow: "Ajutor",
    title: "Întrebări frecvente",
    description: "Adunăm cele mai frecvente întrebări. Până atunci, ne poți scrie oricând.",
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
