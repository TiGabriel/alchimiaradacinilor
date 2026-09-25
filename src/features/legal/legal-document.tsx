import { Scale } from "lucide-react";
import Link from "next/link";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { cn } from "@/lib/utils";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Placeholder a lawyer must complete before launch — visually unmistakable. */
export function ToComplete({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-warning-soft px-1.5 py-0.5 text-[0.9em] font-semibold text-warning">
      [De completat: {children}]
    </span>
  );
}

export function LegalDocument({
  title,
  version,
  intro,
  sections,
}: {
  title: string;
  version: string;
  intro?: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <div className="container-page pb-(--spacing-section)">
      <div className="pt-6 md:pt-8">
        <Breadcrumbs items={[{ label: title }]} />
      </div>
      <div className="grid gap-10 py-10 lg:grid-cols-[15rem_1fr] lg:gap-16">
        <nav aria-label="Cuprins" className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-2 text-sm">
            <p className="text-eyebrow text-ink-muted">Cuprins</p>
            <ol className="flex flex-col gap-1.5">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-ink-muted hover:text-forest">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
        <article className="flex max-w-(--container-prose) min-w-0 flex-col gap-8">
          <header className="flex flex-col gap-4">
            <p className="text-eyebrow text-clay">Informații legale</p>
            <h1 className="text-display-lg">{title}</h1>
            <p className="text-sm text-ink-muted">Versiunea: {version}</p>
            <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft p-4 text-sm text-warning">
              <Scale aria-hidden className="mt-0.5 size-4 shrink-0" />
              <p>
                Document în lucru. Structura și informațiile despre funcționarea site-ului sunt
                reale; secțiunile marcate „De completat” vor fi redactate și verificate de un avocat
                înainte de lansarea magazinului.
              </p>
            </div>
            {intro ? <div className="text-lg text-ink-muted">{intro}</div> : null}
          </header>
          {sections.map((section, i) => (
            <section
              key={section.id}
              id={section.id}
              aria-labelledby={`${section.id}-h`}
              className="flex scroll-mt-28 flex-col gap-3"
            >
              <h2 id={`${section.id}-h`} className="text-2xl">
                {i + 1}. {section.title}
              </h2>
              <div
                className={cn(
                  "flex flex-col gap-3 leading-relaxed text-ink/90 [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:pl-5 [&_ul]:marker:text-sage",
                )}
              >
                {section.body}
              </div>
            </section>
          ))}
          <p className="border-t border-line pt-6 text-sm text-ink-muted">
            Întrebări?{" "}
            <Link
              href="/contact"
              className="font-semibold text-forest underline underline-offset-2"
            >
              Scrie-ne
            </Link>
            .
          </p>
        </article>
      </div>
    </div>
  );
}
