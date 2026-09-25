"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** Sticky header that gains a surface + hairline once the page scrolls. */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-line bg-paper/90 shadow-xs backdrop-blur-md"
          : "border-transparent bg-paper",
      )}
    >
      {children}
    </header>
  );
}
