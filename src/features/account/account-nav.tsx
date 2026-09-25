"use client";

import {
  ClipboardList,
  Heart,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Moon,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { logoutAction } from "../auth/actions";

export const accountSections = [
  { href: "/cont", label: "Prezentare generală", icon: LayoutDashboard },
  { href: "/cont/comenzi", label: "Comenzi", icon: ClipboardList },
  { href: "/cont/favorite", label: "Favorite", icon: Heart },
  { href: "/cont/rutine", label: "Rutinele mele", icon: Moon },
  { href: "/cont/quiz", label: "Rezultate quiz", icon: Sparkles },
  { href: "/cont/recomandari", label: "Recomandări", icon: Wand2 },
  { href: "/cont/adrese", label: "Adrese", icon: MapPin },
  { href: "/cont/date-personale", label: "Date personale", icon: UserRound },
  { href: "/cont/newsletter", label: "Preferințe newsletter", icon: Mail },
  { href: "/cont/securitate", label: "Securitate", icon: ShieldCheck },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/cont" ? pathname === "/cont" : pathname.startsWith(href);
}

export function AccountNav() {
  const pathname = usePathname();
  return (
    <>
      {/* Mobile: horizontally scrollable menu */}
      <nav
        aria-label="Secțiunile contului"
        className="-mx-(--spacing-gutter) scrollbar-none overflow-x-auto px-(--spacing-gutter) lg:hidden"
      >
        <ul className="flex gap-2 pb-1">
          {accountSections.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap",
                    active
                      ? "border-forest bg-forest text-ink-inverse"
                      : "border-line-strong bg-surface text-ink",
                  )}
                >
                  <Icon aria-hidden className="size-4" /> {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: sidebar */}
      <nav aria-label="Secțiunile contului" className="hidden lg:block">
        <ul className="flex flex-col gap-1">
          {accountSections.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] font-semibold transition-colors",
                    active
                      ? "bg-forest-soft text-forest-deep"
                      : "text-ink-muted hover:bg-paper-deep hover:text-ink",
                  )}
                >
                  <Icon aria-hidden className="size-[1.1rem]" /> {label}
                </Link>
              </li>
            );
          })}
          <li className="mt-3 border-t border-line pt-3">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[0.9375rem] font-semibold text-ink-muted hover:bg-paper-deep hover:text-danger"
              >
                <LogOut aria-hidden className="size-[1.1rem]" /> Deconectare
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </>
  );
}
