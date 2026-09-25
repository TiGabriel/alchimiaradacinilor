import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ImagePlaceholder } from "@/components/media/image-placeholder";
import { SmartImage } from "@/components/media/smart-image";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/features/catalog/product-card";
import { ArticleCard, articleDate } from "@/features/journal/article-card";
import { ArticleContent } from "@/features/journal/article-content";
import { JournalListing } from "@/features/journal/journal-listing";
import { RoutineCard } from "@/features/routines/routine-card";
import { siteUrl } from "@/lib/seo";
import { getProductCards } from "@/services/catalog/products";
import {
  getArticleBySlug,
  getArticleCategories,
  getArticleCategory,
  getRelatedArticles,
  listArticles,
} from "@/services/journal/journal";
import { getRoutineCards } from "@/services/routines/routines";

type Props = PageProps<"/jurnal/[slug]">;

/** One URL level serves both categories and articles; category slugs win. */
export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const category = await getArticleCategory(slug);
  if (category) {
    return {
      title: `${category.name} · Jurnal`,
      description: category.description ?? undefined,
      alternates: { canonical: `/jurnal/${category.slug}` },
    };
  }
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  const title = article.seo?.seoTitle ?? article.title;
  const description = article.seo?.metaDescription ?? article.excerpt ?? undefined;
  return {
    title,
    description,
    alternates: { canonical: article.seo?.canonicalUrl ?? `/jurnal/${article.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      publishedTime: article.publishedAt?.toISOString(),
      authors: [article.author],
      images: article.seo?.ogImage?.url ?? article.coverImage?.url,
    },
  };
}

export default async function JournalSlugPage(props: Props) {
  const { slug } = await props.params;
  const { q } = await props.searchParams;

  const category = await getArticleCategory(slug);
  if (category) {
    const query = typeof q === "string" ? q.trim().slice(0, 100) : "";
    const [articles, categories] = await Promise.all([
      listArticles({ categorySlug: category.slug, query }),
      getArticleCategories(),
    ]);
    return (
      <JournalListing
        eyebrow="Jurnal"
        title={category.name}
        description={category.description}
        articles={articles}
        categories={categories}
        activeCategory={category.slug}
        query={query || undefined}
        searchAction={`/jurnal/${category.slug}`}
      />
    );
  }

  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const [products, routines, related] = await Promise.all([
    getProductCards(article.products.map((p) => p.productId)),
    getRoutineCards(article.routines.map((r) => r.routineId)),
    getRelatedArticles(article.id, 3),
  ]);

  return (
    <article className="pb-(--spacing-section)">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.excerpt ?? undefined,
          datePublished: article.publishedAt?.toISOString(),
          dateModified: article.updatedAt.toISOString(),
          author: { "@type": "Organization", name: article.author },
          mainEntityOfPage: siteUrl(`/jurnal/${article.slug}`),
          ...(article.coverImage ? { image: [article.coverImage.url] } : {}),
        }}
      />
      <div className="container-page pt-6 md:pt-8">
        <Breadcrumbs
          items={[
            { label: "Jurnal", href: "/jurnal" },
            ...(article.category
              ? [{ label: article.category.name, href: `/jurnal/${article.category.slug}` }]
              : []),
            { label: article.title },
          ]}
        />
      </div>

      <header className="container-page flex max-w-4xl flex-col gap-5 pt-10 pb-8 text-center md:pt-14">
        <p className="flex flex-wrap items-center justify-center gap-2 text-sm">
          {article.category ? (
            <Link
              href={`/jurnal/${article.category.slug}`}
              className="text-eyebrow text-clay hover:underline"
            >
              {article.category.name}
            </Link>
          ) : null}
          {article.isDemo ? (
            <Badge variant="demo" size="sm">
              Demo
            </Badge>
          ) : null}
        </p>
        <h1 className="text-display-lg">{article.title}</h1>
        {article.excerpt ? (
          <p className="mx-auto max-w-2xl text-lg text-ink-muted">{article.excerpt}</p>
        ) : null}
        <p className="text-sm text-ink-muted">
          {article.author}
          {article.publishedAt ? (
            <>
              {" · "}
              <time dateTime={article.publishedAt.toISOString()}>
                {articleDate.format(article.publishedAt)}
              </time>
            </>
          ) : null}
          {` · ${article.readingMinutes} min de citit`}
        </p>
      </header>

      <div className="container-page max-w-5xl">
        <div className="overflow-hidden rounded-2xl">
          {article.coverImage ? (
            <SmartImage
              src={article.coverImage.url}
              alt={article.coverImage.alt ?? ""}
              aspect="wide"
              priority
              sizes="(min-width: 1024px) 64rem, 100vw"
            />
          ) : (
            <ImagePlaceholder kind="leaf" tone="#B98BB3" className="aspect-[21/9]" />
          )}
        </div>
      </div>

      <div className="container-page mt-12 max-w-(--container-prose)">
        <ArticleContent content={article.content} />
        {article.tags.length ? (
          <ul
            className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6"
            aria-label="Etichete"
          >
            {article.tags.map(({ tag }) => (
              <li key={tag.id}>
                <Link
                  href={`/produse?eticheta=${tag.slug}`}
                  className="rounded-full border border-line-strong px-3 py-1 text-sm hover:border-forest"
                >
                  {tag.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {products.length ? (
        <section
          aria-labelledby="produse-articol"
          className="container-page mt-(--spacing-section) flex flex-col gap-8"
        >
          <h2 id="produse-articol" className="text-display-md">
            Produse din articol
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {products.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {routines.length ? (
        <section
          aria-labelledby="rutine-articol"
          className="container-page mt-16 flex flex-col gap-8"
        >
          <h2 id="rutine-articol" className="text-display-md">
            Rutine legate
          </h2>
          <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {routines.map((r) => (
              <li key={r.id}>
                <RoutineCard routine={r} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {related.length ? (
        <section
          aria-labelledby="articole-similare"
          className="mt-(--spacing-section) bg-paper-deep py-(--spacing-section)"
        >
          <div className="container-page flex flex-col gap-8">
            <h2 id="articole-similare" className="text-display-md">
              Mai citește
            </h2>
            <ul className="grid gap-x-8 gap-y-12 md:grid-cols-3">
              {related.map((a) => (
                <li key={a.id}>
                  <ArticleCard article={a} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </article>
  );
}
