"use client";

import { Compass, Heart, House, Search, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useSearch } from "@/features/search/search-context";
import { useWishlist } from "@/features/wishlist/wishlist-context";
import { cn } from "@/lib/utils";

import { CountBadge } from "./header/count-badge";
import { accountLinks, isActivePath, primaryLinks } from "./nav-config";

/** Hides while scrolling down, reappears when scrolling up or near the top. */
function useHideOnScroll(threshold = 8) {
  const [hidden, setHidden] = useState(false);
  const last = useRef(0);

  useEffect(() => {
    last.current = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - last.current;
      if (Math.abs(delta) < threshold) return;
      setHidden(delta > 0 && y > 120);
      last.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return hidden;
}

const itemClass =
  "relative flex flex-1 flex-col items-center gap-0.5 pt-2 pb-1.5 text-[0.6875rem] font-semibold text-ink-muted transition-colors aria-[current=page]:text-forest [&_svg]:size-[1.35rem]";

export function MobileBottomNav() {
  const pathname = usePathname();
  const hidden = useHideOnScroll();
  const { openSearch } = useSearch();
  const { count: wishlistCount } = useWishlist();

  const link = (href: string, label: string, icon: React.ReactNode, badge?: number) => {
    const active = isActivePath(pathname, href);
    return (
      <Link href={href} className={itemClass} aria-current={active ? "page" : undefined}>
        <span className="relative">
          {icon}
          {badge ? <CountBadge count={badge} className="-top-1.5 -right-2.5" /> : null}
        </span>
        {label}
        <span
          aria-hidden
          className={cn(
            "absolute top-0 h-0.5 w-6 rounded-full bg-forest transition-opacity",
            active ? "opacity-100" : "opacity-0",
          )}
        />
      </Link>
    );
  };

  return (
    <nav
      aria-label="Navigare rapidă"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/92 pb-safe backdrop-blur-md transition-transform duration-300 ease-(--ease-botanical) lg:hidden",
        hidden && "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-lg items-stretch px-2">
        {link(
          primaryLinks.home.href,
          primaryLinks.home.label,
          <House aria-hidden strokeWidth={1.75} />,
        )}
        {link(
          primaryLinks.discover.href,
          primaryLinks.discover.label,
          <Compass aria-hidden strokeWidth={1.75} />,
        )}
        <button type="button" className={itemClass} onClick={openSearch}>
          <Search aria-hidden strokeWidth={1.75} />
          {accountLinks.search.label}
        </button>
        {link(
          accountLinks.wishlist.href,
          accountLinks.wishlist.label,
          <Heart aria-hidden strokeWidth={1.75} />,
          wishlistCount,
        )}
        {link(accountLinks.account.href, "Cont", <UserRound aria-hidden strokeWidth={1.75} />)}
      </div>
    </nav>
  );
}
