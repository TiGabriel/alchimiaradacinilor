"use client";

import { useRef, useState } from "react";

import { ImagePlaceholder } from "@/components/media/image-placeholder";
import { placeholderKindFor } from "@/components/media/product-image";
import { SmartImage } from "@/components/media/smart-image";
import type { ProductType } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";
import type { ProductImageData } from "@/services/catalog/product-types";

type ProductGalleryProps = {
  name: string;
  productType: ProductType;
  images: ProductImageData[];
  tone: string | null;
  badges?: React.ReactNode;
  action?: React.ReactNode;
};

/** Desktop: large image with hover zoom + thumbnails. Mobile: swipeable, scroll-snapped slides with dots. */
export function ProductGallery({
  name,
  productType,
  images,
  tone,
  badges,
  action,
}: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const track = useRef<HTMLDivElement>(null);
  const slides = images.length > 0 ? images : [null];
  const kind = placeholderKindFor(productType);

  const goTo = (index: number) => {
    setActive(index);
    track.current?.children[index]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start",
    });
  };

  const renderSlide = (image: ProductImageData | null, index: number, priority: boolean) =>
    image ? (
      <SmartImage
        src={image.url}
        alt={image.alt ?? `${name} — imaginea ${index + 1}`}
        aspect="portrait"
        priority={priority}
        sizes="(min-width: 1024px) 50vw, 100vw"
        placeholderKind={kind}
        placeholderTone={tone}
      />
    ) : (
      <ImagePlaceholder kind={kind} tone={tone} label={name} className="aspect-[4/5]" />
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-xl bg-paper-deep">
        {/* Mobile swipe track */}
        <div
          ref={track}
          className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto md:hidden"
          onScroll={(e) => {
            const el = e.currentTarget;
            const index = Math.round(el.scrollLeft / el.clientWidth);
            if (index !== active) setActive(index);
          }}
          aria-label={`Galerie ${name}`}
          role="region"
          tabIndex={0}
        >
          {slides.map((image, i) => (
            <div
              key={i}
              className="w-full shrink-0 snap-start"
              aria-roledescription="slide"
              aria-label={`${i + 1} din ${slides.length}`}
            >
              {renderSlide(image, i, i === 0)}
            </div>
          ))}
        </div>

        {/* Desktop zoom */}
        <div
          className={cn("relative hidden md:block", slides[active] && "cursor-zoom-in")}
          onMouseMove={(e) => {
            if (!slides[active]) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setZoom({
              x: ((e.clientX - rect.left) / rect.width) * 100,
              y: ((e.clientY - rect.top) / rect.height) * 100,
            });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          <div
            className="transition-transform duration-200 ease-out"
            style={
              zoom
                ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` }
                : undefined
            }
          >
            {renderSlide(slides[active] ?? null, active, true)}
          </div>
        </div>

        {badges ? <div className="pointer-events-none absolute top-4 left-4">{badges}</div> : null}
        {action ? <div className="absolute top-3 right-3">{action}</div> : null}

        {slides.length > 1 ? (
          <div
            className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden"
            aria-hidden
          >
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full bg-surface/90 transition-all",
                  i === active ? "w-5 bg-forest" : "w-1.5",
                )}
              />
            ))}
          </div>
        ) : null}
      </div>

      {slides.length > 1 ? (
        <ul className="hidden grid-cols-5 gap-3 md:grid" aria-label="Alege imaginea">
          {slides.map((image, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Imaginea ${i + 1}`}
                aria-current={i === active}
                className={cn(
                  "block w-full overflow-hidden rounded-md ring-2 ring-transparent transition-shadow",
                  i === active ? "ring-forest" : "hover:ring-line-strong",
                )}
              >
                {image ? (
                  <SmartImage
                    src={image.url}
                    alt=""
                    aspect="square"
                    sizes="120px"
                    placeholderKind={kind}
                  />
                ) : (
                  <ImagePlaceholder kind={kind} tone={tone} className="aspect-square" />
                )}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
