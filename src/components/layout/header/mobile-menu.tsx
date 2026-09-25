"use client";

import { ArrowRight, Heart, Mail, Menu, Phone, UserRound } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Roots } from "@/components/botanical";
import { FacebookIcon } from "@/components/icons/facebook";
import { usePrefersReducedMotion } from "@/components/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { easeBotanical } from "@/lib/motion";
import { categoryHref, type CategoryNode } from "@/services/catalog/category-tree";
import type { SettingValue } from "@/validation/settings";

import { accountLinks, discoverLinks, isActivePath, primaryLinks } from "../nav-config";

type MobileMenuProps = {
  categories: CategoryNode[];
  contact: SettingValue<"contact">;
  social: SettingValue<"social">;
};

function Item({ index, children }: { index: number; children: React.ReactNode }) {
  const reduce = usePrefersReducedMotion();
  return (
    <motion.li
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reduce
          ? { duration: 0 }
          : { duration: 0.5, ease: easeBotanical, delay: 0.08 + index * 0.045 }
      }
    >
      {children}
    </motion.li>
  );
}

const bigLink =
  "flex items-center justify-between py-3 font-display text-[1.625rem] leading-tight text-ink transition-colors hover:text-forest aria-[current=page]:text-forest";

export function MobileMenu({ categories, contact, social }: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const link = (href: string, label: string) => {
    const active = isActivePath(pathname, href);
    return (
      <DrawerClose asChild>
        <Link href={href} className={bigLink} aria-current={active ? "page" : undefined}>
          {label}
        </Link>
      </DrawerClose>
    );
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger
        className="grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-paper-deep lg:hidden"
        aria-label="Deschide meniul"
      >
        <Menu aria-hidden className="size-6" strokeWidth={1.75} />
      </DrawerTrigger>
      <DrawerContent
        side="left"
        title="Meniu"
        hideTitle
        className="max-w-none sm:max-w-md"
        bodyClassName="px-0 pb-0"
      >
        <nav aria-label="Navigare principală" className="flex min-h-full flex-col">
          <ul className="flex flex-col divide-y divide-line px-6">
            <Item index={0}>{link(primaryLinks.home.href, primaryLinks.home.label)}</Item>
            <Item index={1}>
              <Accordion type="single" collapsible>
                <AccordionItem value="produse" className="border-0">
                  <AccordionTrigger className="py-3 text-[1.625rem] leading-tight">
                    {primaryLinks.products.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ul className="flex flex-col gap-1 border-l border-line pl-4">
                      <li>
                        <DrawerClose asChild>
                          <Link
                            href={primaryLinks.products.href}
                            className="flex items-center gap-1.5 py-1.5 font-semibold text-forest"
                          >
                            Toate produsele <ArrowRight aria-hidden className="size-4" />
                          </Link>
                        </DrawerClose>
                      </li>
                      {categories.map((category) => (
                        <li key={category.id}>
                          <DrawerClose asChild>
                            <Link
                              href={categoryHref(category)}
                              className="block py-1.5 font-semibold text-ink"
                            >
                              {category.name}
                            </Link>
                          </DrawerClose>
                          {category.children.length > 0 ? (
                            <ul className="mb-1 flex flex-col pl-3">
                              {category.children.map((child) => (
                                <li key={child.id}>
                                  <DrawerClose asChild>
                                    <Link
                                      href={categoryHref(child, category)}
                                      className="block py-1 text-sm text-ink-muted"
                                    >
                                      {child.name}
                                    </Link>
                                  </DrawerClose>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Item>
            <Item index={2}>
              <Accordion type="single" collapsible>
                <AccordionItem value="descopera" className="border-0">
                  <AccordionTrigger className="py-3 text-[1.625rem] leading-tight">
                    {primaryLinks.discover.label}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <ul className="flex flex-col gap-1 border-l border-line pl-4">
                      {discoverLinks.map((l) => (
                        <li key={l.href}>
                          <DrawerClose asChild>
                            <Link href={l.href} className="flex flex-col py-1.5">
                              <span className="font-semibold text-ink">{l.label}</span>
                              <span className="text-sm text-ink-muted">{l.description}</span>
                            </Link>
                          </DrawerClose>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Item>
            <Item index={3}>{link(primaryLinks.routines.href, primaryLinks.routines.label)}</Item>
            <Item index={4}>{link(primaryLinks.journal.href, primaryLinks.journal.label)}</Item>
            <Item index={5}>{link(primaryLinks.about.href, primaryLinks.about.label)}</Item>
            <Item index={6}>{link(primaryLinks.contact.href, primaryLinks.contact.label)}</Item>
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-3 px-6">
            <DrawerClose asChild>
              <Link
                href={accountLinks.account.href}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-semibold"
              >
                <UserRound aria-hidden className="size-5 text-forest" strokeWidth={1.75} />
                {accountLinks.account.label}
              </Link>
            </DrawerClose>
            <DrawerClose asChild>
              <Link
                href={accountLinks.wishlist.href}
                className="flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm font-semibold"
              >
                <Heart aria-hidden className="size-5 text-forest" strokeWidth={1.75} />
                {accountLinks.wishlist.label}
              </Link>
            </DrawerClose>
          </div>

          <div className="relative mt-auto overflow-hidden bg-forest px-6 pt-8 pb-10 text-ink-inverse">
            <Roots className="absolute -right-10 -bottom-6 w-64 text-ink-inverse/15" />
            <p className="relative text-eyebrow text-ink-inverse/70">Suntem aici</p>
            <ul className="relative mt-3 flex flex-col gap-2 text-sm">
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <Mail aria-hidden className="size-4" /> {contact.email}
                </a>
              </li>
              {contact.phone ? (
                <li>
                  <a
                    href={`tel:${contact.phone.replace(/\s/g, "")}`}
                    className="inline-flex items-center gap-2 hover:underline"
                  >
                    <Phone aria-hidden className="size-4" /> {contact.phone}
                  </a>
                </li>
              ) : null}
              {social.facebookUrl ? (
                <li>
                  <a
                    href={social.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 hover:underline"
                  >
                    <FacebookIcon className="size-4" /> Facebook
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
