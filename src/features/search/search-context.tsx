"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useMemo } from "react";

type SearchContextValue = { openSearch: () => void };

const SearchContext = createContext<SearchContextValue | null>(null);

/** Phase 2 stub: opens the search page. Phase 3 replaces it with the command palette. */
export function SearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const value = useMemo(() => ({ openSearch: () => router.push("/cautare") }), [router]);
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used inside <SearchProvider>");
  return ctx;
}
