import type { Metadata } from "next";

import { Logo } from "@/components/brand/logo";
import { getSettings } from "@/services/settings";

import { StyleguideDemos } from "./styleguide-demos";

export const metadata: Metadata = {
  title: "Ghid de stil",
  robots: { index: false, follow: false },
};

const colors = [
  ["paper", "Fundal pagină"],
  ["paper-deep", "Secțiuni alternante"],
  ["surface", "Carduri"],
  ["ink", "Text"],
  ["ink-muted", "Text secundar"],
  ["line", "Linii"],
  ["line-strong", "Linii accentuate"],
  ["forest", "Primar"],
  ["forest-deep", "Primar închis"],
  ["forest-soft", "Primar deschis"],
  ["sage", "Decorativ"],
  ["sage-soft", "Decorativ deschis"],
  ["clay", "Reduceri, accent"],
  ["clay-soft", "Accent deschis"],
  ["ochre", "Stele, ornamente"],
  ["ochre-soft", "Ocru deschis"],
  ["success", "Succes"],
  ["warning", "Atenționare"],
  ["danger", "Eroare"],
] as const;

const toc = [
  ["culori", "Culori"],
  ["tipografie", "Tipografie"],
  ["forme", "Forme"],
  ["logo", "Logo"],
  ["butoane", "Butoane"],
  ["formulare", "Formulare"],
  ["insigne", "Insigne"],
  ["carduri", "Carduri"],
  ["suprapuneri", "Suprapuneri"],
  ["tab-uri", "Tab-uri"],
  ["comert", "Comerț"],
  ["stari", "Stări"],
  ["imagini", "Imagini"],
  ["botanic", "Botanic"],
  ["animatii", "Animații"],
] as const;

/** Internal component gallery. Not linked from navigation; noindex. */
export default async function StyleguidePage() {
  const { brand } = await getSettings();

  return (
    <div className="container-page py-12">
      <header className="flex flex-col gap-3 pb-8">
        <p className="text-eyebrow text-clay">Intern</p>
        <h1 className="text-display-lg">Ghid de stil</h1>
        <p className="max-w-2xl text-ink-muted">
          Tokenuri, componente și animații folosite pe site. Pagina nu apare în navigare și nu este
          indexată.
        </p>
        <nav aria-label="Cuprins ghid de stil" className="mt-4">
          <ul className="flex flex-wrap gap-2">
            {toc.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="inline-flex h-8 items-center rounded-full border border-line bg-surface px-3 text-sm font-semibold text-ink-muted hover:border-forest hover:text-forest"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <section
        id="culori"
        aria-labelledby="culori-title"
        className="scroll-mt-28 border-t border-line py-12"
      >
        <h2 id="culori-title" className="mb-8 text-display-md">
          Culori
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {colors.map(([token, label]) => (
            <li key={token} className="overflow-hidden rounded-lg border border-line bg-surface">
              <div className="h-20" style={{ background: `var(--color-${token})` }} />
              <div className="p-3">
                <p className="font-mono text-sm font-semibold">{token}</p>
                <p className="text-xs text-ink-muted">{label}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="tipografie"
        aria-labelledby="tipografie-title"
        className="scroll-mt-28 border-t border-line py-12"
      >
        <h2 id="tipografie-title" className="mb-8 text-display-md">
          Tipografie
        </h2>
        <div className="flex flex-col gap-6">
          <p className="text-display-xl">Ritualuri botanice</p>
          <p className="text-display-lg">Aromă de lavandă și portocală</p>
          <p className="text-display-md">Șase ținuturi, țesături și rădăcini</p>
          <p className="font-display text-2xl italic">Înflorește încet, în ritmul tău</p>
          <p className="text-eyebrow text-clay">Etichetă mică · Eyebrow</p>
          <p className="max-w-(--container-prose) text-lg">
            Corp de text mare (Manrope). Diacritice românești: ă â î ș ț Ă Â Î Ș Ț — „ghilimele” și
            – liniuțe.
          </p>
          <p className="max-w-(--container-prose)">
            Corp de text standard. Uleiurile esențiale se descriu prin aromă, atmosferă și ritual —
            niciodată prin promisiuni medicale.
          </p>
          <p className="text-sm text-ink-muted">Text mic, secundar, pentru detalii și indicații.</p>
        </div>
      </section>

      <section
        id="forme"
        aria-labelledby="forme-title"
        className="scroll-mt-28 border-t border-line py-12"
      >
        <h2 id="forme-title" className="mb-8 text-display-md">
          Raze și umbre
        </h2>
        <div className="flex flex-wrap gap-6">
          {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((r) => (
            <div key={r} className="flex flex-col items-center gap-2">
              <div
                className="size-20 border border-line-strong bg-surface"
                style={{ borderRadius: `var(--radius-${r})` }}
              />
              <span className="font-mono text-xs">radius-{r}</span>
            </div>
          ))}
          {(["xs", "soft", "lifted", "overlay"] as const).map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div
                className="size-20 rounded-lg bg-surface"
                style={{ boxShadow: `var(--shadow-${s})` }}
              />
              <span className="font-mono text-xs">shadow-{s}</span>
            </div>
          ))}
        </div>
      </section>

      <section
        id="logo"
        aria-labelledby="logo-title"
        className="scroll-mt-28 border-t border-line py-12"
      >
        <h2 id="logo-title" className="mb-4 text-display-md">
          Logo
        </h2>
        <p className="mb-8 max-w-2xl text-ink-muted">
          Logo-ul provine din setarea <code className="font-mono text-sm">brand</code>{" "}
          (SiteSettings). Poate fi înlocuit cu o imagine fără modificări de cod.
        </p>
        <div className="flex flex-wrap items-center gap-10">
          <Logo brand={brand} size="sm" href={null} />
          <Logo brand={brand} href={null} />
          <Logo brand={brand} size="lg" href={null} />
          <div className="rounded-lg bg-forest-deep p-6">
            <Logo brand={brand} tone="inverse" href={null} />
          </div>
        </div>
      </section>

      <StyleguideDemos />
    </div>
  );
}
