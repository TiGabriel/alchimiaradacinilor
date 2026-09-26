import { CalendarDays, Clock, Gauge, Moon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Leaf } from "@/components/botanical";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ImagePlaceholder } from "@/components/media/image-placeholder";
import { SmartImage } from "@/components/media/smart-image";
import { Reveal } from "@/components/motion";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/markdown";
import { getCurrentUser } from "@/features/auth/session";
import { ProductCard } from "@/features/catalog/product-card";
import { AddRoutineToCartButton, SaveRoutineButton } from "@/features/routines/routine-actions";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { productHref } from "@/services/catalog/product-types";
import { pageMetadata } from "@/services/seo";
import {
  difficultyLabels,
  getRoutineBySlug,
  isRoutineSaved,
  timeOfDayLabels,
} from "@/services/routines/routines";

type Props = PageProps<"/rutine/[slug]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const routine = await getRoutineBySlug((await props.params).slug);
  if (!routine) return {};
  return pageMetadata({
    title: routine.seo?.seoTitle ?? routine.title,
    description: routine.seo?.metaDescription ?? routine.summary,
    path: `/rutine/${routine.slug}`,
    canonical: routine.seo?.canonicalUrl,
    image: routine.seo?.ogImage?.url ?? routine.image?.url,
    imageAlt: routine.image?.alt,
    noIndex: routine.seo?.noIndex,
  });
}

export default async function RoutinePage(props: Props) {
  const { slug } = await props.params;
  const routine = await getRoutineBySlug(slug);
  if (!routine) notFound();
  const user = await getCurrentUser();
  const saved = user ? await isRoutineSaved(user.id, routine.id) : false;

  const meta = [
    { icon: Moon, label: timeOfDayLabels[routine.timeOfDay] },
    routine.durationMinutes ? { icon: Clock, label: `${routine.durationMinutes} minute` } : null,
    { icon: Gauge, label: difficultyLabels[routine.difficulty] },
    routine.frequency ? { icon: CalendarDays, label: routine.frequency } : null,
  ].filter((m) => m !== null);

  return (
    <article className="pb-(--spacing-section)">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "HowTo",
          inLanguage: "ro-RO",
          name: routine.title,
          description: routine.summary,
          url: siteUrl(`/rutine/${routine.slug}`),
          ...(routine.image ? { image: absoluteUrl(routine.image.url) } : {}),
          ...(routine.durationMinutes ? { totalTime: `PT${routine.durationMinutes}M` } : {}),
          step: routine.steps.map((s, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: s.title,
            text: s.instructions,
          })),
        }}
      />
      <div className="container-page pt-6 md:pt-8">
        <Breadcrumbs items={[{ label: "Rutine", href: "/rutine" }, { label: routine.title }]} />
      </div>

      <header className="container-page grid gap-8 pt-8 pb-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
        <Reveal className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            <p className="text-eyebrow text-clay">Rutină</p>
            {routine.isDemo ? (
              <Badge variant="demo" size="sm">
                Demo
              </Badge>
            ) : null}
          </div>
          <h1 className="text-display-lg">{routine.title}</h1>
          <p className="text-lg text-ink-muted">{routine.summary}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
            {meta.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <Icon aria-hidden className="size-4 text-forest" /> {label}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3 pt-2">
            <AddRoutineToCartButton routineId={routine.id} />
            <SaveRoutineButton routineId={routine.id} initiallySaved={saved} />
          </div>
        </Reveal>
        <div className="overflow-hidden rounded-2xl">
          {routine.image ? (
            <SmartImage
              src={routine.image.url}
              alt={routine.image.alt ?? routine.title}
              aspect="landscape"
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          ) : (
            <ImagePlaceholder
              kind="leaf"
              tone={
                routine.timeOfDay === "EVENING"
                  ? "#B98BB3"
                  : routine.timeOfDay === "MORNING"
                    ? "#E3B23C"
                    : "#8FB58A"
              }
              className="aspect-[4/3]"
            />
          )}
        </div>
      </header>

      <div className="container-page grid gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-10">
          {routine.description ? (
            <Markdown className="text-lg">{routine.description}</Markdown>
          ) : null}
          <section aria-labelledby="pasi" className="flex flex-col gap-6">
            <h2 id="pasi" className="text-display-md">
              Pașii
            </h2>
            <ol className="relative flex flex-col gap-8 border-l border-line-strong pl-8">
              {routine.steps.map((step, i) => (
                <li key={step.id} className="relative flex flex-col gap-1.5">
                  <span
                    aria-hidden
                    className="absolute top-0 -left-[2.85rem] grid size-9 place-items-center rounded-full bg-forest font-bold text-ink-inverse"
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-xl">
                    {step.title}
                    {step.durationMinutes ? (
                      <span className="ml-2 font-sans text-sm font-normal text-ink-muted">
                        · {step.durationMinutes} min
                      </span>
                    ) : null}
                  </h3>
                  <p className="text-ink-muted">{step.instructions}</p>
                  {step.product?.active ? (
                    <Link
                      href={productHref(step.product)}
                      className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
                    >
                      <Leaf className="size-4 text-forest" /> {step.product.name}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
          {routine.needs.length || routine.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {routine.needs.map(({ need }) => (
                <Link
                  key={need.slug}
                  href={`/descopera/${need.slug}`}
                  className="rounded-full bg-forest-soft px-3 py-1 text-sm font-semibold text-forest-deep hover:bg-sage-soft"
                >
                  {need.name}
                </Link>
              ))}
              {routine.tags.map(({ tag }) => (
                <Link
                  key={tag.slug}
                  href={`/produse?eticheta=${tag.slug}`}
                  className="rounded-full border border-line-strong px-3 py-1 text-sm hover:border-forest"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        <aside
          aria-labelledby="produse-rutina"
          className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start"
        >
          <h2 id="produse-rutina" className="text-2xl">
            Produsele rutinei
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8">
            {routine.productItems.map(({ product, optional, note }) => (
              <li key={product.id} className="flex flex-col gap-2">
                <ProductCard product={product} sizes="(min-width: 1024px) 15vw, 45vw" />
                {optional ? (
                  <Badge variant="outline" size="sm" className="self-start">
                    Opțional
                  </Badge>
                ) : null}
                {note ? <p className="text-xs text-ink-muted">{note}</p> : null}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-muted">
            Butonul adaugă câte o bucată din fiecare produs în stoc. Poți modifica apoi coșul.
          </p>
          {routine.articles.length ? (
            <div className="flex flex-col gap-3 border-t border-line pt-5">
              <h2 className="text-xl">Din jurnal</h2>
              <ul className="flex flex-col gap-3">
                {routine.articles.map(({ article }) => (
                  <li key={article.slug}>
                    <Link
                      href={`/jurnal/${article.slug}`}
                      className="flex flex-col gap-0.5 hover:text-forest"
                    >
                      <span className="font-semibold">{article.title}</span>
                      {article.excerpt ? (
                        <span className="line-clamp-2 text-sm text-ink-muted">
                          {article.excerpt}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
