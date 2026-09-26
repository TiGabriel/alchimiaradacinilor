import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Leaf, Sprig } from "@/components/botanical";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Despre noi",
    description:
      "Alchimia Rădăcinilor: uleiuri esențiale, amestecuri și ritualuri simple, explicate pe înțelesul tuturor.",
    path: "/despre",
  });
}

const principles = [
  {
    title: "Explicăm, nu promitem",
    body: "Descriem aroma, atmosfera și momentul zilei în care se potrivește fiecare produs. Nu promitem efecte asupra sănătății — pentru asta există medicul tău.",
  },
  {
    title: "Puțin și bine",
    body: "Nu ai nevoie de zeci de sticluțe. Câteva arome bine alese și obiceiul de a le folosi sunt un început mai bun decât un raft plin.",
  },
  {
    title: "Ritualuri, nu reguli",
    body: "Rutinele noastre durează câteva minute și se potrivesc cu ziua ta: o dimineață luminoasă, o pauză de concentrare, o seară liniștită.",
  },
  {
    title: "Totul la vedere",
    body: "Prețuri cu TVA inclus, costuri de livrare afișate înainte de comandă, 14 zile pentru retur și date personale folosite doar cu acordul tău.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-(--spacing-section) pb-(--spacing-section)">
      <section className="relative overflow-hidden">
        <div className="container-page grid gap-10 pt-10 md:pt-16 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <Reveal className="flex flex-col gap-5">
            <p className="text-eyebrow text-clay">Despre noi</p>
            <h1 className="text-display-xl text-balance">
              Arome simple, <em className="font-normal text-forest italic">spuse pe înțeles.</em>
            </h1>
            <p className="max-w-xl text-lg text-ink-muted">
              Alchimia Rădăcinilor este un magazin de uleiuri esențiale, amestecuri și accesorii
              pentru casă, gândit pentru cei care vor să înceapă fără să se piardă în termeni
              tehnici. Numele vine de la ideea care ne ghidează: tot ce e bun pornește de la
              rădăcină — din plantă, din obicei, din câteva minute doar pentru tine.
            </p>
          </Reveal>
          <div aria-hidden className="relative hidden h-72 lg:block">
            <Sprig className="absolute top-0 right-16 h-64 text-sage/70" />
            <Leaf className="absolute bottom-6 left-10 size-20 text-clay/40" />
          </div>
        </div>
      </section>

      <section aria-labelledby="principii" className="bg-paper-deep py-(--spacing-section)">
        <div className="container-page flex flex-col gap-10">
          <h2 id="principii" className="text-display-lg">
            Ce ne ghidează
          </h2>
          <Stagger className="grid gap-6 md:grid-cols-2">
            {principles.map((p) => (
              <StaggerItem key={p.title}>
                <article className="flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-6 md:p-8">
                  <h3 className="text-2xl">{p.title}</h3>
                  <p className="text-ink-muted">{p.body}</p>
                </article>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section aria-labelledby="incepe" className="container-page flex flex-col gap-6">
        <h2 id="incepe" className="text-display-md">
          De unde să începi
        </h2>
        <p className="max-w-2xl text-ink-muted">
          Dacă ești la început, quiz-ul îți propune câteva arome și îți explică alegerea. Dacă știi
          deja ce cauți, catalogul și rutinele te așteaptă.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/quiz">
              Fă quiz-ul aromatic <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/produse">Vezi produsele</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/contact">Scrie-ne</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
