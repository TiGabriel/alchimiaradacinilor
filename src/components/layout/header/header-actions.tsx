"use client";

import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";

import { useCart } from "@/features/cart/cart-context";
import { useSearch } from "@/features/search/search-context";
import { useWishlist } from "@/features/wishlist/wishlist-context";
import { cn } from "@/lib/utils";

import { accountLinks } from "../nav-config";

import { CountBadge } from "./count-badge";

const iconButton =
  "relative grid size-11 place-items-center rounded-full text-ink transition-colors hover:bg-paper-deep hover:text-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest [&_svg]:size-[1.35rem]";

function plural(count: number, one: string, many: string) {
  return count === 1 ? `1 ${one}` : `${count} ${many}`;
}

export function SearchButton({ className }: { className?: string }) {
  const { openSearch } = useSearch();
  return (
    <button
      type="button"
      className={cn(iconButton, className)}
      onClick={openSearch}
      aria-label="Caută produse"
    >
      <Search aria-hidden strokeWidth={1.75} />
    </button>
  );
}

export function CartButton({ className }: { className?: string }) {
  const { count, openCart } = useCart();
  return (
    <button
      type="button"
      className={cn(iconButton, className)}
      onClick={openCart}
      aria-label={count > 0 ? `Coșul tău, ${plural(count, "produs", "produse")}` : "Coșul tău, gol"}
    >
      <ShoppingBag aria-hidden strokeWidth={1.75} />
      <CountBadge count={count} />
    </button>
  );
}

export function HeaderActions() {
  const { count: wishlistCount } = useWishlist();
  return (
    <div className="flex items-center gap-0.5">
      <SearchButton />
      <Link
        href={accountLinks.account.href}
        className={cn(iconButton, "hidden md:grid")}
        aria-label="Contul meu"
      >
        <UserRound aria-hidden strokeWidth={1.75} />
      </Link>
      <Link
        href={accountLinks.wishlist.href}
        className={cn(iconButton, "hidden md:grid")}
        aria-label={
          wishlistCount > 0 ? `Favorite, ${plural(wishlistCount, "produs", "produse")}` : "Favorite"
        }
      >
        <Heart aria-hidden strokeWidth={1.75} />
        <CountBadge count={wishlistCount} />
      </Link>
      <CartButton />
    </div>
  );
}
