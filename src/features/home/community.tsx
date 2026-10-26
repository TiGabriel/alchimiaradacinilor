import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Blossom, Leaf } from "@/components/botanical";
import { FacebookIcon } from "@/components/icons/facebook";
import { NewsletterForm } from "@/components/layout/footer/newsletter-form";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

/**
 * Newsletter invitation (plus an account invitation for guests) and, when configured in
 * settings, a link to the Facebook community. Nothing is embedded or fabricated: it is a
 * plain outbound link.
 */
export function CommunitySection({
  facebookUrl,
  signedIn,
}: {
  facebookUrl?: string;
  signedIn: boolean;
}) {
  return (
    <section aria-labelledby="scrisori" className="bg-paper-deep py-(--spacing-section)">
      <div
        className={cn(
          "container-page grid gap-5 md:gap-6",
          facebookUrl ? "lg:grid-cols-[1.5fr_1fr]" : "max-w-4xl",
        )}
      >
        <Reveal className="relative overflow-hidden rounded-2xl border border-line bg-surface p-7 shadow-soft sm:p-10 md:p-12">
          <Blossom className="pointer-events-none absolute -right-6 -bottom-8 w-40 text-clay/15 md:w-52" />
          <div className="relative flex max-w-xl flex-col gap-4">
            <p className="text-eyebrow text-clay">Newsletter</p>
            <h2 id="scrisori" className="text-display-md">
              O scrisoare botanică, în fiecare lună
            </h2>
            <p className="text-ink-muted">
              Articole noi din jurnal, recenzii, ritualuri de sezon și povești despre plante. Fără
              zgomot, doar ce merită citit, cu o ceașcă de ceai alături.
            </p>
            <div className="pt-2">
              <NewsletterForm tone="ink" source="homepage" />
            </div>
            {signedIn ? null : (
              <p className="text-sm text-ink-muted">
                Sau{" "}
                <Link
                  href="/cont/inregistrare"
                  className="font-semibold text-forest underline underline-offset-2"
                >
                  fă-ți un cont gratuit
                </Link>
                : îți salvezi produsele și ritualurile preferate și primești recomandări potrivite
                ție.
              </p>
            )}
          </div>
        </Reveal>

        {facebookUrl ? (
          <Reveal
            delay={0.1}
            className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-2xl bg-forest p-7 text-ink-inverse sm:p-10"
          >
            <Leaf className="pointer-events-none absolute -top-4 -right-4 w-28 rotate-45 text-ink-inverse/10" />
            <div className="relative flex flex-col gap-3">
              <p className="text-eyebrow text-ink-inverse/70">Comunitate</p>
              <h2 className="font-display text-3xl text-ink-inverse">Hai în comunitatea noastră</h2>
              <p className="text-ink-inverse/80">
                Idei de ritualuri, noutăți și întrebări de la alți iubitori de arome.
              </p>
            </div>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex h-12 items-center gap-2 self-start rounded-full bg-paper px-6 font-semibold text-forest-deep transition-colors hover:bg-surface"
            >
              <FacebookIcon className="size-5" />
              Urmărește-ne pe Facebook
              <ArrowUpRight aria-hidden className="size-4" />
              <span className="sr-only">(se deschide într-o filă nouă)</span>
            </a>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
