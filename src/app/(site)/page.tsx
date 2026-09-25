import { ArrowRight, Compass, Moon, Sparkles } from "lucide-react";
import Link from "next/link";

import { Blossom, Leaf, ROOT_PATHS, SectionDivider, SPRIG_PATHS } from "@/components/botanical";
import { ImagePlaceholder, type PlaceholderKind } from "@/components/media/image-placeholder";
import {
  BotanicalFloat,
  DrawLine,
  Parallax,
  Reveal,
  Stagger,
  StaggerItem,
} from "@/components/motion";
import { Button } from "@/components/ui/button";
import { getCategoryTree } from "@/services/catalog/categories";
import { categoryHref } from "@/services/catalog/category-tree";

const categoryArt: Record<string, PlaceholderKind> = {
  "uleiuri-individuale": "bottle",
  amestecuri: "bottle",
  kituri: "kit",
  difuzoare: "diffuser",
  accesorii: "accessory",
};

const entryPoints = [
  {
    href: "/quiz",
    icon: Sparkles,
    title: "Fă quiz-ul aromatic",
    text: "Câteva întrebări despre preferințele tale și îți propunem aromele potrivite.",
  },
  {
    href: "/descopera/nevoi",
    icon: Compass,
    title: "Alege după nevoie",
    text: "Relaxare, concentrare, energie sau o casă proaspătă — pornește de la momentul tău.",
  },
  {
    href: "/rutine",
    icon: Moon,
    title: "Urmează o rutină",
    text: "Ritualuri simple, pas cu pas, pentru dimineți și seri.",
  },
];

export default async function HomePage() {
  const categories = await getCategoryTree();

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container-page grid items-center gap-12 pt-10 pb-16 md:pt-16 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pb-24">
          <Reveal className="relative z-10 flex flex-col gap-6">
            <p className="text-eyebrow text-clay">Uleiuri esențiale · Ritualuri botanice</p>
            <h1 className="text-display-xl">
              Aromele care te <em className="font-normal text-forest italic">aduc acasă</em>
            </h1>
            <p className="max-w-lg text-lg text-ink-muted md:text-xl">
              Uleiuri esențiale, amestecuri și ritualuri simple, alese cu grijă pentru momentele
              tale de zi cu zi.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/produse">
                  Descoperă produsele <ArrowRight aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/quiz">Fă quiz-ul aromatic</Link>
              </Button>
            </div>
          </Reveal>

          <div className="relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none">
            <Parallax className="absolute inset-x-[8%] top-0 bottom-0" offset={50}>
              <div className="relative size-full overflow-hidden rounded-t-full rounded-b-2xl bg-[radial-gradient(120%_80%_at_50%_10%,var(--color-sage-soft),var(--color-forest-soft)_55%,var(--color-paper-deep))] shadow-lifted">
                <DrawLine
                  d={SPRIG_PATHS}
                  viewBox="0 0 120 160"
                  className="absolute inset-x-[18%] top-[14%] h-[70%] text-forest/70"
                  strokeWidth={0.9}
                />
                <DrawLine
                  d={ROOT_PATHS}
                  viewBox="0 0 200 140"
                  className="absolute inset-x-0 -bottom-[4%] w-full text-forest/25"
                  strokeWidth={0.8}
                  duration={3}
                />
              </div>
            </Parallax>
            <BotanicalFloat
              className="absolute top-[12%] -left-[2%] w-16 md:w-20"
              drift={12}
              sway={6}
            >
              <Leaf className="w-full text-sage" />
            </BotanicalFloat>
            <BotanicalFloat
              className="absolute right-0 bottom-[22%] w-14 md:w-16"
              drift={10}
              delay={1.5}
            >
              <Blossom className="w-full text-clay/50" />
            </BotanicalFloat>
            <BotanicalFloat
              className="absolute top-[6%] right-[6%] w-10"
              drift={8}
              delay={3}
              sway={-5}
            >
              <Leaf className="w-full rotate-90 text-forest/40" />
            </BotanicalFloat>
          </div>
        </div>
      </section>

      {/* Entry points */}
      <section className="bg-paper-deep py-(--spacing-section)">
        <div className="container-page">
          <Reveal className="mb-10 flex max-w-2xl flex-col gap-3 md:mb-14">
            <p className="text-eyebrow text-clay">De unde începi</p>
            <h2 className="text-display-lg">Trei căi către aroma potrivită</h2>
          </Reveal>
          <Stagger className="grid gap-4 md:grid-cols-3 md:gap-6">
            {entryPoints.map(({ href, icon: Icon, title, text }) => (
              <StaggerItem key={href}>
                <Link
                  href={href}
                  className="group flex h-full flex-col gap-4 rounded-xl border border-line bg-surface p-7 shadow-xs transition-[box-shadow,transform,border-color] duration-300 ease-(--ease-botanical) hover:-translate-y-1 hover:border-line-strong hover:shadow-lifted motion-reduce:hover:translate-y-0"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-forest-soft text-forest">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="text-2xl">{title}</h3>
                  <p className="text-ink-muted">{text}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-forest">
                    Începe
                    <ArrowRight
                      aria-hidden
                      className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                    />
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 ? (
        <section className="py-(--spacing-section)">
          <div className="container-page">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
              <Reveal className="flex max-w-2xl flex-col gap-3">
                <p className="text-eyebrow text-clay">Categorii</p>
                <h2 className="text-display-lg">Explorează colecția</h2>
              </Reveal>
              <Button asChild variant="link">
                <Link href="/produse">
                  Toate produsele <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            <Stagger className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {categories.map((category) => (
                <StaggerItem key={category.id}>
                  <Link
                    href={categoryHref(category)}
                    className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-xl sm:aspect-[5/4]"
                  >
                    <div className="absolute inset-0 transition-transform duration-700 ease-(--ease-botanical) group-hover:scale-[1.04] motion-reduce:transition-none">
                      <ImagePlaceholder kind={categoryArt[category.slug] ?? "leaf"} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-forest-deep/80 via-forest-deep/15 to-transparent" />
                    <div className="relative flex items-end justify-between gap-2 p-4 md:p-6">
                      <div className="flex flex-col">
                        <h3 className="font-display text-xl text-ink-inverse md:text-2xl">
                          {category.name}
                        </h3>
                        <span className="text-sm text-ink-inverse/80">
                          {category.productCount === 1
                            ? "1 produs"
                            : `${category.productCount} produse`}
                        </span>
                      </div>
                      <span className="hidden size-10 shrink-0 place-items-center rounded-full bg-paper/90 text-forest transition-transform group-hover:translate-x-0.5 sm:grid">
                        <ArrowRight aria-hidden className="size-4" />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      <div className="container-page">
        <SectionDivider />
      </div>

      {/* Promise */}
      <section className="py-(--spacing-section)">
        <Reveal className="container-page flex max-w-3xl flex-col items-center gap-6 text-center">
          <Leaf className="size-10 text-sage" />
          <p className="font-display text-2xl leading-snug text-ink md:text-3xl">
            Credem în ritualuri mici, făcute cu intenție: o aromă la începutul zilei, un moment de
            liniște seara, o casă care miroase a grădină.
          </p>
          <Button asChild variant="link">
            <Link href="/despre">Povestea noastră</Link>
          </Button>
        </Reveal>
      </section>
    </>
  );
}
