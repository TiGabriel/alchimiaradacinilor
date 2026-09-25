import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

import { Leaf, SectionDivider } from "@/components/botanical";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/features/auth/session";
import { ProductCard } from "@/features/catalog/product-card";
import { CategoryTiles } from "@/features/discover/category-cards";
import { NeedPicker } from "@/features/discover/need-picker";
import { CommunitySection } from "@/features/home/community";
import { EssentialsSection } from "@/features/home/essentials";
import { HomeHero } from "@/features/home/hero";
import { PersonalRowSection } from "@/features/home/personal-row";
import { ReviewsSection } from "@/features/home/reviews";
import { ArticleCard } from "@/features/journal/article-card";
import { RoutineCard } from "@/features/routines/routine-card";
import { getCategoryTree } from "@/services/catalog/categories";
import { getFeaturedProducts } from "@/services/catalog/products";
import { getNeedsWithCounts } from "@/services/catalog/taxonomy";
import { getHomeEssentials, getHomeReviews, getPersonalRow } from "@/services/home/home";
import { popularCategories } from "@/services/home/select";
import { listArticles } from "@/services/journal/journal";
import { listRoutines } from "@/services/routines/routines";
import { getSettings } from "@/services/settings";

function SectionHeading({
  id,
  eyebrow,
  title,
  link,
}: {
  id: string;
  eyebrow: string;
  title: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 md:mb-14">
      <Reveal className="flex max-w-2xl flex-col gap-3">
        <p className="text-eyebrow text-clay">{eyebrow}</p>
        <h2 id={id} className="text-display-lg">
          {title}
        </h2>
      </Reveal>
      {link ? (
        <Button asChild variant="link">
          <Link href={link.href}>
            {link.label} <ArrowRight aria-hidden />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

export default async function HomePage() {
  const user = await getCurrentUser();
  const [settings, needs, tree, featured, essentials, routines, articles, reviews, personal] =
    await Promise.all([
      getSettings(),
      getNeedsWithCounts(),
      getCategoryTree(),
      getFeaturedProducts(4),
      getHomeEssentials(),
      listRoutines({ take: 3 }),
      listArticles({ take: 3 }),
      getHomeReviews(3),
      user ? getPersonalRow(user.id) : Promise.resolve(null),
    ]);
  const categories = popularCategories(tree, 6);
  const pickerNeeds = needs.filter((n) => n.productCount > 0);

  return (
    <>
      <HomeHero image={settings.homepage.heroImage} />

      {user ? <PersonalRowSection firstName={user.firstName} row={personal} /> : null}

      {/* Need picker → quiz */}
      <section aria-labelledby="de-unde" className="bg-paper-deep py-(--spacing-section)">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-16">
          <Reveal className="flex flex-col gap-4">
            <p className="text-eyebrow text-clay">Primul pas</p>
            <h2 id="de-unde" className="text-display-lg">
              Nu știi de unde să începi?
            </h2>
            <p className="max-w-md text-lg text-ink-muted">
              Alege momentul pentru care cauți o aromă sau răspunde la câteva întrebări și îți
              arătăm ce ți se potrivește — de fiecare dată îți spunem și de ce.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex min-w-0 flex-col gap-6">
            {pickerNeeds.length ? (
              <div className="flex flex-col gap-3">
                <p className="font-display text-2xl">Ce cauți?</p>
                <NeedPicker needs={pickerNeeds} />
              </div>
            ) : null}
            <div className="flex flex-col items-start gap-4 rounded-xl bg-forest p-6 text-ink-inverse sm:flex-row sm:items-center sm:justify-between md:p-7">
              <p className="flex items-start gap-3">
                <Sparkles aria-hidden className="mt-1 size-5 shrink-0 text-ink-inverse/80" />
                <span>
                  <span className="block font-display text-xl text-ink-inverse">Quiz aromatic</span>
                  <span className="text-sm text-ink-inverse/80">
                    Câteva întrebări scurte, cam două minute.
                  </span>
                </span>
              </p>
              <Link
                href="/quiz"
                className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-paper px-5 font-semibold text-forest-deep transition-colors hover:bg-surface"
              >
                Începe quiz-ul <ArrowRight aria-hidden className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Popular categories */}
      {categories.length > 0 ? (
        <section aria-labelledby="categorii" className="py-(--spacing-section)">
          <div className="container-page">
            <SectionHeading
              id="categorii"
              eyebrow="Categorii populare"
              title="Explorează colecția"
              link={{ href: "/descopera/categorii", label: "Toate categoriile" }}
            />
            <CategoryTiles categories={categories} />
          </div>
        </section>
      ) : null}

      {/* Featured products */}
      {featured.length > 0 ? (
        <section aria-labelledby="recomandate" className="pb-(--spacing-section)">
          <div className="container-page">
            <SectionHeading
              id="recomandate"
              eyebrow="Recomandate"
              title="Alese cu grijă"
              link={{ href: "/produse", label: "Toate produsele" }}
            />
            <Stagger
              as="ul"
              className="grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4"
            >
              {featured.map((product) => (
                <StaggerItem as="li" key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      {essentials.length > 0 ? <EssentialsSection items={essentials} /> : null}

      {/* Featured routines */}
      {routines.length > 0 ? (
        <section aria-labelledby="rutine" className="py-(--spacing-section)">
          <div className="container-page">
            <SectionHeading
              id="rutine"
              eyebrow="Rutine"
              title="Ritualuri mici, făcute cu intenție"
              link={{ href: "/rutine", label: "Toate rutinele" }}
            />
            <Stagger as="ul" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {routines.map((routine) => (
                <StaggerItem as="li" key={routine.id}>
                  <RoutineCard routine={routine} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      {reviews.length > 0 ? (
        <>
          <div className="container-page">
            <SectionDivider />
          </div>
          <ReviewsSection reviews={reviews} />
        </>
      ) : null}

      {/* Latest articles */}
      {articles.length > 0 ? (
        <section aria-labelledby="jurnal" className="bg-paper-deep py-(--spacing-section)">
          <div className="container-page">
            <SectionHeading
              id="jurnal"
              eyebrow="Din jurnal"
              title="Povești despre plante și arome"
              link={{ href: "/jurnal", label: "Toate articolele" }}
            />
            <Stagger as="ul" className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <StaggerItem as="li" key={article.id}>
                  <ArticleCard article={article} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      ) : null}

      <CommunitySection facebookUrl={settings.social.facebookUrl} />

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
