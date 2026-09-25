"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationMenu } from "radix-ui";

import { Sprig } from "@/components/botanical";
import { categoryHref, type CategoryNode } from "@/services/catalog/category-tree";
import { cn } from "@/lib/utils";

import { discoverLinks, isActivePath, primaryLinks } from "../nav-config";

const topLink =
  "relative inline-flex h-10 items-center gap-1 rounded-full px-3.5 text-[0.9375rem] font-semibold text-ink transition-colors hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest data-[active=true]:text-forest data-[state=open]:text-forest";

function ActiveDot({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-forest transition-opacity",
        active ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

function SimpleLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = isActivePath(pathname, href);
  return (
    <NavigationMenu.Item>
      <NavigationMenu.Link asChild active={active}>
        <Link
          href={href}
          className={topLink}
          data-active={active}
          aria-current={active ? "page" : undefined}
        >
          {label}
          <ActiveDot active={active} />
        </Link>
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  );
}

const panel =
  "absolute top-0 left-0 data-[motion=from-end]:animate-fade-in data-[motion=from-start]:animate-fade-in data-[motion=to-end]:animate-fade-out data-[motion=to-start]:animate-fade-out";

export function DesktopNav({ categories }: { categories: CategoryNode[] }) {
  const pathname = usePathname();
  const productsActive = isActivePath(pathname, primaryLinks.products.href);
  const discoverActive = isActivePath(pathname, primaryLinks.discover.href) || pathname === "/quiz";

  return (
    <NavigationMenu.Root
      className="relative hidden lg:block"
      delayDuration={80}
      aria-label="Navigare principală"
    >
      <NavigationMenu.List className="flex items-center gap-0.5">
        <SimpleLink {...primaryLinks.home} pathname={pathname} />

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={cn(topLink, "group")} data-active={productsActive}>
            {primaryLinks.products.label}
            <ChevronDown
              aria-hidden
              className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-180"
            />
            <ActiveDot active={productsActive} />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={panel}>
            <div className="grid w-[min(58rem,calc(100vw-4rem))] grid-cols-[1fr_17rem] gap-8 p-8">
              <div className="grid grid-cols-3 gap-x-8 gap-y-7">
                {categories.map((category) => (
                  <div key={category.id} className="flex flex-col gap-2">
                    <NavigationMenu.Link asChild>
                      <Link
                        href={categoryHref(category)}
                        className="group/cat inline-flex items-center gap-1.5 font-display text-lg text-ink hover:text-forest"
                      >
                        {category.name}
                        <ArrowRight
                          aria-hidden
                          className="size-4 -translate-x-1 opacity-0 transition-all group-hover/cat:translate-x-0 group-hover/cat:opacity-100"
                        />
                      </Link>
                    </NavigationMenu.Link>
                    {category.children.length > 0 ? (
                      <ul className="flex flex-col gap-1.5">
                        {category.children.map((child) => (
                          <li key={child.id}>
                            <NavigationMenu.Link asChild>
                              <Link
                                href={categoryHref(child, category)}
                                className="text-sm text-ink-muted transition-colors hover:text-forest"
                              >
                                {child.name}
                              </Link>
                            </NavigationMenu.Link>
                          </li>
                        ))}
                      </ul>
                    ) : category.description ? (
                      <p className="line-clamp-2 text-sm text-ink-muted">{category.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="relative flex flex-col justify-between overflow-hidden rounded-lg bg-forest p-6 text-ink-inverse">
                <Sprig className="absolute -right-6 -bottom-4 h-44 text-ink-inverse/20" />
                <div className="relative flex flex-col gap-2">
                  <span className="text-eyebrow text-ink-inverse/70">
                    Nu știi de unde să începi?
                  </span>
                  <p className="font-display text-xl leading-snug text-ink-inverse">
                    Descoperă aromele potrivite ție în câteva întrebări.
                  </p>
                </div>
                <div className="relative mt-6 flex flex-col gap-2">
                  <NavigationMenu.Link asChild>
                    <Link
                      href="/quiz"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-paper px-5 text-sm font-semibold text-forest-deep transition-colors hover:bg-surface"
                    >
                      Începe quiz-ul
                    </Link>
                  </NavigationMenu.Link>
                  <NavigationMenu.Link asChild>
                    <Link
                      href={primaryLinks.products.href}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-ink-inverse underline-offset-4 hover:underline"
                    >
                      Toate produsele <ArrowRight aria-hidden className="size-4" />
                    </Link>
                  </NavigationMenu.Link>
                </div>
              </div>
            </div>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger className={cn(topLink, "group")} data-active={discoverActive}>
            {primaryLinks.discover.label}
            <ChevronDown
              aria-hidden
              className="size-4 transition-transform duration-300 group-data-[state=open]:rotate-180"
            />
            <ActiveDot active={discoverActive} />
          </NavigationMenu.Trigger>
          <NavigationMenu.Content className={panel}>
            <ul className="grid w-[36rem] grid-cols-2 gap-2 p-5">
              {discoverLinks.map((link) => (
                <li key={link.href}>
                  <NavigationMenu.Link asChild>
                    <Link
                      href={link.href}
                      className="flex flex-col gap-1 rounded-md p-4 transition-colors hover:bg-paper-deep focus-visible:bg-paper-deep"
                    >
                      <span className="font-display text-lg text-ink">{link.label}</span>
                      <span className="text-sm text-ink-muted">{link.description}</span>
                    </Link>
                  </NavigationMenu.Link>
                </li>
              ))}
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <SimpleLink {...primaryLinks.routines} pathname={pathname} />
        <SimpleLink {...primaryLinks.journal} pathname={pathname} />
        <SimpleLink {...primaryLinks.about} pathname={pathname} />
        <SimpleLink {...primaryLinks.contact} pathname={pathname} />
      </NavigationMenu.List>

      <div className="absolute top-full left-1/2 z-40 flex -translate-x-1/2 justify-center pt-3">
        <NavigationMenu.Viewport className="relative h-(--radix-navigation-menu-viewport-height) w-(--radix-navigation-menu-viewport-width) origin-top overflow-hidden rounded-xl border border-line bg-surface shadow-overlay transition-[width,height] duration-300 ease-(--ease-botanical) data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
      </div>
    </NavigationMenu.Root>
  );
}
