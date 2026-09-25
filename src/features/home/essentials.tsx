import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Sprig } from "@/components/botanical";
import { ProductImage } from "@/components/media/product-image";
import { Parallax, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { Price } from "@/components/ui/price";
import { productHref, type ProductCardData } from "@/services/catalog/product-types";
import type { Essential } from "@/services/home/select";

/** "Cele 5 esențiale": an editorial, numbered short-list for people starting out. */
export function EssentialsSection({ items }: { items: Array<Essential<ProductCardData>> }) {
  return (
    <section
      aria-labelledby="esentiale"
      className="relative overflow-hidden bg-forest-deep py-(--spacing-section) text-ink-inverse"
    >
      <Parallax
        className="pointer-events-none absolute -top-10 -right-16 hidden w-72 md:block"
        offset={60}
      >
        <Sprig className="w-full text-ink-inverse/10" />
      </Parallax>
      <div className="relative container-page grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <Reveal className="flex flex-col gap-5 lg:sticky lg:top-28 lg:self-start">
          <p className="text-eyebrow text-ink-inverse/70">Pentru început</p>
          <h2 id="esentiale" className="text-display-lg text-ink-inverse">
            Cele {items.length} esențiale
          </h2>
          <p className="max-w-md text-lg text-ink-inverse/80">
            Dacă ai începe cu doar câteva sticluțe, pe acestea le-am alege noi: arome versatile,
            ușor de combinat între ele, pentru fiecare moment al zilei.
          </p>
          <Button
            asChild
            variant="outline"
            className="mt-2 self-start border-ink-inverse/40 bg-transparent text-ink-inverse hover:border-ink-inverse hover:bg-ink-inverse/10 hover:text-ink-inverse"
          >
            <Link href="/produse/uleiuri-individuale">
              Toate uleiurile <ArrowRight aria-hidden />
            </Link>
          </Button>
        </Reveal>

        <Stagger as="ol" className="flex flex-col">
          {items.map(({ product, note, position }) => (
            <StaggerItem
              as="li"
              key={product.id}
              className="border-t border-ink-inverse/15 last:border-b"
            >
              <article className="group relative grid grid-cols-[auto_4.5rem_1fr] items-center gap-4 py-5 sm:grid-cols-[auto_5.5rem_1fr_auto] sm:gap-6 md:py-6">
                <span
                  aria-hidden
                  className="w-9 font-display text-2xl text-ink-inverse/45 italic md:w-12 md:text-3xl"
                >
                  {String(position).padStart(2, "0")}
                </span>
                <div className="overflow-hidden rounded-lg">
                  <ProductImage
                    name={product.name}
                    productType={product.productType}
                    image={product.images[0]}
                    tone={product.tone}
                    aspect="square"
                    sizes="88px"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="font-display text-xl text-ink-inverse md:text-2xl">
                    <Link
                      href={productHref(product)}
                      className="rounded-xs after:absolute after:inset-0 hover:underline hover:underline-offset-4 focus-visible:outline-ink-inverse"
                    >
                      <span className="sr-only">{position}. </span>
                      {product.name}
                    </Link>
                  </h3>
                  <p className="text-sm text-ink-inverse/75 md:text-base">{note}</p>
                  <Price
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    size="sm"
                    showDiscountBadge={false}
                    tone="inverse"
                    className="sm:hidden"
                  />
                </div>
                <div className="hidden items-center gap-4 sm:flex">
                  <Price
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    size="sm"
                    showDiscountBadge={false}
                    tone="inverse"
                  />
                  <ArrowRight
                    aria-hidden
                    className="size-5 text-ink-inverse/60 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  />
                </div>
              </article>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
