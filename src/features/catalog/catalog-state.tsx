"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useTransition } from "react";

import { serializeCatalogParams, type CatalogFilters } from "@/services/catalog/listing";

type CatalogState = {
  filters: CatalogFilters;
  pending: boolean;
  /** Applies a change; filter changes reset to page 1. */
  update: (change: Partial<CatalogFilters>, options?: { keepPage?: boolean }) => void;
  hrefFor: (filters: CatalogFilters) => string;
};

const Ctx = createContext<CatalogState | null>(null);

/** Filter state lives in the URL; navigation runs in a transition so results dim while loading. */
export function CatalogStateProvider({
  filters,
  children,
}: {
  filters: CatalogFilters;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const hrefFor = useCallback(
    (next: CatalogFilters) => {
      const qs = serializeCatalogParams(next);
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [pathname],
  );

  const update = useCallback<CatalogState["update"]>(
    (change, options) => {
      const next = {
        ...filters,
        ...change,
        page: options?.keepPage ? (change.page ?? filters.page) : 1,
      };
      startTransition(() => router.replace(hrefFor(next), { scroll: false }));
    },
    [filters, hrefFor, router],
  );

  const value = useMemo(
    () => ({ filters, pending, update, hrefFor }),
    [filters, pending, update, hrefFor],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogState() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalogState must be used inside <CatalogStateProvider>");
  return ctx;
}

/** Dims the results while a filter navigation is in flight. */
export function CatalogResults({ children }: { children: React.ReactNode }) {
  const { pending } = useCatalogState();
  return (
    <div
      aria-busy={pending || undefined}
      className="transition-opacity duration-300 data-[pending=true]:pointer-events-none data-[pending=true]:opacity-50"
      data-pending={pending}
    >
      {children}
    </div>
  );
}
