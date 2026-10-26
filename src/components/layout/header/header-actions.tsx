"use client";

import { Heart, Search, UserRound } from "lucide-react";
import Link from "next/link";

import { useSession } from "@/features/auth/session-context";
import { useSearch } from "@/features/search/search-context";
import { useWishlist } from "@/features/wishlist/wishlist-context";
import { pluralRo } from "@/lib/plural";
import { cn } from "@/lib/utils";

import { accountLinks, NEWSLETTER_ANCHOR } from "../nav-config";

import { CountBadge } from "./count-badge";

const iconButton =
  "relative grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-paper-deep hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest [&_svg]:size-[1.35rem]";

export function SearchButton({ className }: { className?: string }) {
  const { openSearch } = useSearch();
  return (
    <button
      type="button"
      className={cn(iconButton, className)}
      onClick={openSearch}
      aria-label="Caută pe site"
    >
      <Search aria-hidden strokeWidth={1.75} />
    </button>
  );
}

/** Account icon: the user's initial once signed in. */
export function AccountLink({ className }: { className?: string }) {
  const { user } = useSession();
  return (
    <Link
      href={user ? accountLinks.account.href : "/cont/autentificare"}
      className={className}
      aria-label={user ? `Contul meu (${user.firstName})` : "Autentificare"}
    >
      {user ? (
        <span className="grid size-8 place-items-center rounded-full bg-forest text-sm font-bold text-ink-inverse">
          {user.firstName.slice(0, 1).toUpperCase()}
        </span>
      ) : (
        <UserRound aria-hidden strokeWidth={1.75} />
      )}
    </Link>
  );
}

export function HeaderActions() {
  const { count: wishlistCount } = useWishlist();
  return (
    <div className="flex items-center gap-0.5">
      <SearchButton />
      <Link
        href={accountLinks.wishlist.href}
        className={cn(iconButton, "hidden md:grid")}
        aria-label={
          wishlistCount > 0 ? `Salvate, ${pluralRo(wishlistCount, "produs", "produse")}` : "Salvate"
        }
      >
        <Heart aria-hidden strokeWidth={1.75} />
        <CountBadge count={wishlistCount} />
      </Link>
      <Link
        href={accountLinks.account.href}
        className={cn(iconButton, "hidden md:grid")}
        aria-label="Contul meu"
      >
        <UserRound aria-hidden strokeWidth={1.75} />
      </Link>
      {/* The sign-up form lives in the footer of every page. */}
      <a
        href={`#${NEWSLETTER_ANCHOR}`}
        className="ml-2 hidden h-10 items-center rounded-full bg-forest px-5 text-sm font-semibold whitespace-nowrap text-ink-inverse transition-colors hover:bg-forest-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest xl:inline-flex"
      >
        Abonează-te
      </a>
    </div>
  );
}
