import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Blossom, Leaf, ROOT_PATHS, SPRIG_PATHS } from "@/components/botanical";
import { BotanicalFloat, DrawLine, Parallax } from "@/components/motion";
import { Button } from "@/components/ui/button";

type HeroProps = { image: { src: string; alt: string } | null };

/**
 * Editorial hero. The heading is never animated (it is the LCP element when no photo
 * is configured); the rest rises in with a CSS animation that starts at first paint.
 * A configured photo is served by next/image with high priority.
 */
export function HomeHero({ image }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="container-page grid items-center gap-10 pt-8 pb-14 md:pt-14 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pb-24">
        <div className="relative z-10 flex flex-col gap-6">
          <p className="animate-rise text-eyebrow text-clay motion-reduce:animate-none">
            Uleiuri esențiale · Ritualuri botanice
          </p>
          <h1 className="text-display-xl text-balance">
            Ritualuri simple.{" "}
            <em className="font-normal text-forest italic">Arome care îți transformă rutina.</em>
          </h1>
          <p className="max-w-lg animate-rise text-lg text-ink-muted [animation-delay:120ms] motion-reduce:animate-none md:text-xl">
            Uleiuri esențiale, amestecuri și ritualuri pas cu pas, alese cu grijă pentru diminețile,
            pauzele și serile tale.
          </p>
          <div className="mt-2 flex animate-rise flex-col gap-3 [animation-delay:220ms] motion-reduce:animate-none sm:flex-row sm:flex-wrap">
            <Button asChild size="lg">
              <Link href="/produse">
                Descoperă produsele <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/quiz">Găsește ce ți se potrivește</Link>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-[19rem] sm:max-w-md lg:max-w-none">
          <Parallax className="absolute inset-x-[8%] top-0 bottom-0" offset={50}>
            <div className="relative size-full overflow-hidden rounded-t-full rounded-b-2xl bg-[radial-gradient(120%_80%_at_50%_10%,var(--color-sage-soft),var(--color-forest-soft)_55%,var(--color-paper-deep))] shadow-lifted">
              {image ? (
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  priority
                  fetchPriority="high"
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 85vw"
                  className="object-cover"
                />
              ) : (
                <>
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
                </>
              )}
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
  );
}
