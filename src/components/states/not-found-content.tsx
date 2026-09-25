import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

import { Roots } from "@/components/botanical";
import { BotanicalFloat } from "@/components/motion";
import { Button } from "@/components/ui/button";

export function NotFoundContent() {
  return (
    <section className="relative overflow-hidden">
      <BotanicalFloat
        className="absolute top-10 -left-16 hidden w-72 text-sage/40 md:block"
        drift={14}
        sway={4}
      >
        <Roots className="w-full text-current" />
      </BotanicalFloat>
      <div className="relative container-page flex flex-col items-center py-24 text-center md:py-32">
        <p className="text-eyebrow text-clay">Eroare 404</p>
        <h1 className="mt-4 max-w-2xl text-display-lg">Poteca aceasta nu duce nicăieri</h1>
        <p className="mt-5 max-w-lg text-lg text-ink-muted">
          Pagina pe care o cauți a fost mutată sau nu mai există. Hai să te întoarcem pe drumul bun.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/produse">
              Vezi produsele <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">Înapoi acasă</Link>
          </Button>
        </div>
        <Link
          href="/cautare"
          className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-forest underline-offset-4 hover:underline"
        >
          <Search aria-hidden className="size-4" /> Sau caută ce aveai în minte
        </Link>
      </div>
    </section>
  );
}
