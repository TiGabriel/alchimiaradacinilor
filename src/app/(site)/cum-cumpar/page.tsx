import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Reveal } from "@/components/motion";
import { pageMetadata } from "@/services/seo";
import { getSetting } from "@/services/settings";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Cum cumpăr",
    description:
      "Nu vindem produse: le găsești descrise aici și le cumperi direct de pe site-ul oficial doTERRA.",
    path: "/cum-cumpar",
  });
}

const steps = [
  {
    title: "Descoperi produsul aici",
    body: "Citești descrierea, profilul aromatic, ritualurile în care îl folosim și recenziile.",
  },
  {
    title: "Mergi pe site-ul doTERRA",
    body: "Butonul „Cumpără de pe doTERRA” deschide, într-o filă nouă, produsul pe site-ul oficial doTERRA. Este un link de recomandare (vezi mai jos). Dacă un produs arată „Link în curând”, îl găsești deocamdată căutându-l direct pe site-ul doTERRA.",
  },
  {
    title: "Comanzi de acolo",
    body: "Comanda, plata, livrarea și eventualele retururi se fac pe site-ul doTERRA, după condițiile lor.",
  },
];

export default async function HowToBuyPage() {
  const affiliate = await getSetting("affiliate");
  return (
    <div className="container-page pb-(--spacing-section)">
      <div className="pt-6 md:pt-8">
        <Breadcrumbs items={[{ label: "Cum cumpăr" }]} />
      </div>
      <Reveal className="flex max-w-(--container-prose) flex-col gap-5 py-10">
        <p className="text-eyebrow text-clay">Cum cumpăr</p>
        <h1 className="text-display-xl text-balance">Nu vindem produse, le povestim.</h1>
        <p className="text-lg text-ink-muted">
          Alchimia Rădăcinilor este un jurnal despre uleiuri esențiale și ritualuri. Produsele
          despre care scriem se cumpără direct de pe site-ul oficial doTERRA, la prețul afișat
          acolo. Când cumperi printr-un link de pe acest site, primim o mică recompensă de la
          doTERRA, fără niciun cost în plus pentru tine.
        </p>
      </Reveal>
      <ol className="grid max-w-(--container-prose) gap-4">
        {steps.map((step, i) => (
          <li key={step.title} className="flex gap-4 rounded-2xl border border-line bg-surface p-6">
            <span
              aria-hidden
              className="grid size-9 shrink-0 place-items-center rounded-full bg-forest-soft font-semibold text-forest"
            >
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="font-semibold">{step.title}</h2>
              <p className="text-ink-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <section
        id="recomandare"
        aria-labelledby="recomandare-titlu"
        className="mt-10 flex max-w-(--container-prose) scroll-mt-24 flex-col gap-3"
      >
        <h2 id="recomandare-titlu" className="text-display-md">
          Despre linkurile de recomandare
        </h2>
        <p className="text-ink-muted">{affiliate.disclosureLong}</p>
      </section>
      <p className="mt-8 max-w-(--container-prose) text-ink-muted">
        Ai o întrebare despre un produs?{" "}
        <Link href="/contact" className="text-forest underline underline-offset-2">
          Scrie-ne
        </Link>
        .
      </p>
    </div>
  );
}
