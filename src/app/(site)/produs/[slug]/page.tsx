import { ArrowRight, MessageSquareHeart, Moon, PackageCheck, Truck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionDivider, Sprig } from "@/components/botanical";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { Reveal } from "@/components/motion";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Markdown } from "@/components/ui/markdown";
import { Price } from "@/components/ui/price";
import { RatingStars, reviewCountLabel } from "@/components/ui/rating-stars";
import { ProductBadges } from "@/features/catalog/product-badges";
import { ProductCard } from "@/features/catalog/product-card";
import { ProductGallery } from "@/features/catalog/product-gallery";
import { ProductPurchase } from "@/features/catalog/product-purchase";
import { RoutineCard } from "@/features/routines/routine-card";
import { WishlistButton } from "@/features/wishlist/wishlist-button";
import { formatMoney } from "@/lib/money";
import { siteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { categoryHref } from "@/services/catalog/category-tree";
import {
  getProductBySlug,
  getRelatedProducts,
  type ProductDetail,
} from "@/services/catalog/product-detail";
import { productHref, stockLabel, stockStatus } from "@/services/catalog/product-types";
import { getArticlesForProduct } from "@/services/journal/journal";
import { getRoutinesForProduct } from "@/services/routines/routines";
import { getSetting } from "@/services/settings";
import { productTypeLabels } from "@/validation/product";

type Props = PageProps<"/produs/[slug]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = product.seo?.seoTitle ?? product.name;
  const description = product.seo?.metaDescription ?? product.shortDescription;
  const image = product.seo?.ogImage ?? product.images[0]?.url;
  return {
    title,
    description,
    alternates: { canonical: product.seo?.canonicalUrl ?? productHref(product) },
    openGraph: {
      title,
      description,
      url: productHref(product),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

function Section({
  id,
  title,
  eyebrow,
  children,
}: {
  id: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 border-t border-line py-10 md:py-14"
    >
      <Reveal className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div className="flex flex-col gap-2">
          {eyebrow ? <p className="text-eyebrow text-clay">{eyebrow}</p> : null}
          <h2 id={`${id}-title`} className="text-display-md">
            {title}
          </h2>
        </div>
        <div className="min-w-0">{children}</div>
      </Reveal>
    </section>
  );
}

function AromaProfile({ aromas }: { aromas: ProductDetail["aromas"] }) {
  return (
    <ul className="flex flex-col gap-5">
      {aromas.map((aroma) => (
        <li key={aroma.slug} className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <Link
              href={`/produse?aroma=${aroma.slug}`}
              className="inline-flex items-center gap-2 font-semibold text-ink hover:text-forest"
            >
              <span
                aria-hidden
                className="size-3 rounded-full"
                style={{ background: aroma.colorHex ?? "var(--color-sage)" }}
              />
              {aroma.name}
            </Link>
            <span className="text-sm text-ink-muted">Intensitate {aroma.intensity} din 5</span>
          </div>
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  background:
                    i < aroma.intensity
                      ? (aroma.colorHex ?? "var(--color-sage)")
                      : "var(--color-line)",
                }}
              />
            ))}
          </div>
          {aroma.description ? <p className="text-sm text-ink-muted">{aroma.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function productJsonLd(product: ProductDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.shortDescription,
    url: siteUrl(productHref(product)),
    ...(product.images.length ? { image: product.images.map((i) => i.url) } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    category: product.parentCategory
      ? `${product.parentCategory.name} > ${product.category.name}`
      : product.category.name,
    offers: {
      "@type": "Offer",
      url: siteUrl(productHref(product)),
      priceCurrency: "RON",
      price: (product.price / 100).toFixed(2),
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.rating != null && product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.toFixed(1),
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  };
}

export default async function ProductPage(props: Props) {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, shipping, routines, articles] = await Promise.all([
    getRelatedProducts(product.id, 4),
    getSetting("shipping"),
    getRoutinesForProduct(product.id),
    getArticlesForProduct(product.id),
  ]);
  const status = stockStatus(product.stock);
  const tone = product.aromas[0]?.colorHex ?? null;
  const categoryLink = categoryHref(product.category, product.parentCategory);

  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <div className="container-page pt-6 md:pt-8">
        <Breadcrumbs
          items={[
            { label: "Produse", href: "/produse" },
            ...(product.parentCategory
              ? [{ label: product.parentCategory.name, href: categoryHref(product.parentCategory) }]
              : []),
            { label: product.category.name, href: categoryLink },
            { label: product.name },
          ]}
        />
      </div>

      {/* Hero */}
      <div className="container-page grid gap-8 pt-6 pb-12 md:pt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-16">
        <ProductGallery
          name={product.name}
          productType={product.productType}
          images={product.images}
          tone={tone}
          badges={
            <ProductBadges
              product={{ ...product, isNew: product.tags.some((t) => t.slug === "nou") }}
            />
          }
          action={<WishlistButton product={product} />}
        />

        <div className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {product.brand ? (
              <span className="text-eyebrow text-ink-muted">{product.brand.name}</span>
            ) : null}
            <span aria-hidden className="text-line-strong">
              ·
            </span>
            <Link href={categoryLink} className="font-semibold text-forest hover:underline">
              {productTypeLabels[product.productType]}
            </Link>
          </div>
          <h1 className="text-display-lg">{product.name}</h1>
          <a
            href="#recenzii"
            className="inline-flex w-fit items-center gap-2 text-sm text-ink-muted hover:text-ink"
          >
            <RatingStars value={product.rating} showValue />
            {product.reviewCount > 0
              ? reviewCountLabel(product.reviewCount)
              : "Nicio recenzie încă"}
          </a>
          <p className="text-lg text-ink-muted">{product.shortDescription}</p>
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="xl" />
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                status === "in-stock" ? "success" : status === "low-stock" ? "warning" : "danger"
              }
            >
              <PackageCheck aria-hidden /> {stockLabel(product.stock)}
            </Badge>
            {product.isDemo ? (
              <Badge variant="demo" title="Datele acestui produs sunt demonstrative">
                Produs demonstrativ
              </Badge>
            ) : null}
          </div>

          <ProductPurchase product={product} />

          <ul className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 text-sm text-ink-muted">
            {shipping.freeShippingThreshold != null ? (
              <li className="flex items-center gap-2">
                <Truck aria-hidden className="size-4 text-forest" />
                Livrare gratuită pentru comenzi de peste{" "}
                {formatMoney(shipping.freeShippingThreshold)}
              </li>
            ) : null}
            <li className="flex items-center gap-2">
              <span aria-hidden className="grid size-4 place-items-center">
                <Sprig className="h-4 text-forest" />
              </span>
              Ambalat cu grijă, pregătit pentru ritualul tău
            </li>
          </ul>
        </div>
      </div>

      <div className="container-page">
        <Section id="descriere" title="Descriere" eyebrow="Despre produs">
          <Markdown>{product.description}</Markdown>
          {product.kitItems.length > 0 ? (
            <div className="mt-8 flex flex-col gap-3">
              <h3 className="font-display text-xl">Ce conține</h3>
              <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
                {product.kitItems.map((item) => (
                  <li
                    key={item.product.slug}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    {item.product.active ? (
                      <Link
                        href={productHref(item.product)}
                        className="font-semibold text-ink hover:text-forest"
                      >
                        {item.product.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">{item.product.name}</span>
                    )}
                    <span className="text-sm text-ink-muted">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {product.ingredients.length > 0 ? (
            <div className="mt-8 flex flex-col gap-3">
              <h3 className="font-display text-xl">Ingrediente</h3>
              <ul className="flex flex-col gap-1 text-ink-muted">
                {product.ingredients.map((ing) => (
                  <li key={ing.name}>
                    {ing.name}
                    {ing.latinName ? <em className="ml-1">({ing.latinName})</em> : null}
                    {ing.note ? ` — ${ing.note}` : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        {product.aromas.length > 0 ? (
          <Section id="profil-aromatic" title="Profil aromatic" eyebrow="Aromă">
            <AromaProfile aromas={product.aromas} />
          </Section>
        ) : null}

        {product.needs.length > 0 ? (
          <Section id="rutina" title="Cum poate fi integrat în rutină" eyebrow="Momente potrivite">
            <p className="mb-6 text-ink-muted">
              Descoperă momentele zilei în care {product.name} se potrivește cel mai bine.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {product.needs.map((need) => (
                <li key={need.slug}>
                  <Link
                    href={`/produse?nevoie=${need.slug}`}
                    className="group flex h-full flex-col gap-1 rounded-lg border border-line bg-surface p-4 transition-colors hover:border-forest"
                  >
                    <span className="inline-flex items-center gap-2 font-semibold text-ink group-hover:text-forest">
                      <Moon aria-hidden className="size-4 text-sage" />
                      {need.name}
                    </span>
                    {need.description ? (
                      <span className="text-sm text-ink-muted">{need.description}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {product.usageInfo ? (
          <Section id="utilizare" title="Recomandări de utilizare" eyebrow="Utilizare">
            <Markdown>{product.usageInfo}</Markdown>
          </Section>
        ) : null}

        {product.safetyInfo ? (
          <Section id="siguranta" title="Siguranță" eyebrow="Informații importante">
            <Markdown>{product.safetyInfo}</Markdown>
          </Section>
        ) : null}

        <Section id="rutine" title="Rutine care includ acest produs" eyebrow="Rutine">
          {routines.length > 0 ? (
            <ul className="grid gap-5 sm:grid-cols-2">
              {routines.map((routine) => (
                <li key={routine.id}>
                  <RoutineCard routine={routine} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              size="sm"
              headingLevel="h3"
              className="mx-0 items-start text-left"
              title="Încă nu există o rutină cu acest produs"
              description="Descoperă ritualurile noastre pas cu pas — poți folosi produsul și în rutinele tale."
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link href="/rutine">Vezi rutinele</Link>
                </Button>
              }
            />
          )}
          {articles.length > 0 ? (
            <div className="mt-8 flex flex-col gap-3">
              <h3 className="font-display text-xl">Din jurnal</h3>
              <ul className="flex flex-col gap-2">
                {articles.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/jurnal/${a.slug}`}
                      className="font-semibold text-forest hover:underline"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Section>

        <Section id="recenzii" title="Recenzii" eyebrow="Păreri">
          <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-line-strong bg-surface p-8">
            <MessageSquareHeart aria-hidden className="size-8 text-sage" />
            <p className="font-display text-2xl">Fii primul care lasă o recenzie.</p>
            <p className="text-ink-muted">
              Recenziile vor putea fi scrise în curând de clienții care au comandat produsul.
            </p>
          </div>
        </Section>
      </div>

      {related.length > 0 ? (
        <section
          aria-labelledby="similare-title"
          className="mt-4 bg-paper-deep py-(--spacing-section)"
        >
          <div className="container-page">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p className="text-eyebrow text-clay">Recomandări</p>
                <h2 id="similare-title" className="text-display-md">
                  Îți poate plăcea și
                </h2>
              </div>
              <Button asChild variant="link">
                <Link href={categoryLink}>
                  Mai multe din {product.category.name} <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
            <ul className={cn("grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 lg:grid-cols-4")}>
              {related.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <div className="container-page">
          <SectionDivider className="my-12" />
        </div>
      )}
    </>
  );
}
