"use client";

import { ArrowRight, CornerDownLeft, FolderTree, History, Search, Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { ImagePlaceholder } from "@/components/media/image-placeholder";
import { placeholderKindFor } from "@/components/media/product-image";
import { SmartImage } from "@/components/media/smart-image";
import { Spinner } from "@/components/ui/spinner";
import type { ProductType } from "@/generated/prisma/enums";
import { formatMoney } from "@/lib/money";
import { pluralRo } from "@/lib/plural";
import { cn } from "@/lib/utils";
import type { SearchApiHit, SearchApiResponse } from "@/services/search/api-types";

import { pushRecent, readRecent, writeRecent } from "./recent-searches";

type Option =
  | { kind: "hit"; id: string; hit: SearchApiHit; group: string }
  | { kind: "recent"; id: string; query: string; group: string }
  | { kind: "all"; id: string; query: string; group: string };

export function searchPageHref(query: string) {
  return `/cautare?q=${encodeURIComponent(query.trim())}`;
}

function useSearchResults(query: string, enabled: boolean) {
  const [data, setData] = useState<SearchApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setLoading(true);
        setError(false);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=5`, {
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(String(res.status));
          setData((await res.json()) as SearchApiResponse);
        } catch (e) {
          if ((e as Error).name !== "AbortError") setError(true);
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      query.trim() ? 140 : 0,
    );
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, enabled]);

  return { data, loading, error };
}

function HitVisual({ hit }: { hit: SearchApiHit }) {
  if (hit.type === "product") {
    const image = typeof hit.meta?.image === "string" ? hit.meta.image : null;
    const type = (hit.meta?.productType as ProductType | undefined) ?? "OTHER";
    const tone = typeof hit.meta?.tone === "string" ? hit.meta.tone : null;
    return (
      <span className="block size-12 shrink-0 overflow-hidden rounded-md">
        {image ? (
          <SmartImage
            src={image}
            alt=""
            aspect="square"
            sizes="48px"
            placeholderKind={placeholderKindFor(type)}
          />
        ) : (
          <ImagePlaceholder kind={placeholderKindFor(type)} tone={tone} className="size-12" />
        )}
      </span>
    );
  }
  const Icon = hit.type === "category" ? FolderTree : Tag;
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-soft text-forest">
      <Icon aria-hidden className="size-4" />
    </span>
  );
}

type SearchPaletteProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** Command-palette search: instant grouped suggestions, keyboard navigation, recent searches. */
export function SearchPalette({ open, onOpenChange }: SearchPaletteProps) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [active, setActive] = useState({ key: "", index: 0 });
  const { data, loading, error } = useSearchResults(query, open);

  const trimmed = query.trim();
  const stale = data?.query !== trimmed;

  const options = useMemo<Option[]>(() => {
    const list: Option[] = [];
    if (!trimmed) {
      recent.forEach((q, i) =>
        list.push({ kind: "recent", id: `${id}-r${i}`, query: q, group: "recent" }),
      );
    }
    data?.groups.forEach((group) =>
      group.hits.forEach((hit) =>
        list.push({ kind: "hit", id: `${id}-${hit.type}-${hit.id}`, hit, group: group.type }),
      ),
    );
    if (trimmed) list.push({ kind: "all", id: `${id}-all`, query: trimmed, group: "all" });
    return list;
  }, [data, recent, trimmed, id]);

  // The highlight belongs to one set of options; when they change it falls back to the first.
  const optionsKey = options.map((o) => o.id).join("|");
  const activeIndex = active.key === optionsKey ? active.index : 0;
  const setActiveIndex = (update: number | ((i: number) => number)) =>
    setActive({
      key: optionsKey,
      index: typeof update === "function" ? update(activeIndex) : update,
    });

  const remember = useCallback((q: string) => {
    setRecent((current) => {
      const next = pushRecent(current, q);
      writeRecent(next);
      return next;
    });
  }, []);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const choose = (option: Option | undefined) => {
    if (!option) {
      if (trimmed) {
        remember(trimmed);
        go(searchPageHref(trimmed));
      }
      return;
    }
    if (option.kind === "recent") {
      setQuery(option.query);
      inputRef.current?.focus();
      return;
    }
    if (trimmed) remember(trimmed);
    go(option.kind === "all" ? searchPageHref(option.query) : option.hit.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!options.length) return;
      const delta = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) => (i + delta + options.length) % options.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(options[activeIndex]);
    }
  };

  useEffect(() => {
    const active = options[activeIndex];
    if (active) document.getElementById(active.id)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, options]);

  const resultCount = data?.groups.reduce((n, g) => n + g.total, 0) ?? 0;
  const renderOption = (option: Option, index: number, content: React.ReactNode) => (
    <li
      key={option.id}
      id={option.id}
      role="option"
      aria-selected={index === activeIndex}
      onMouseMove={() => setActiveIndex(index)}
      onClick={() => choose(option)}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        index === activeIndex ? "bg-forest-soft" : "hover:bg-paper-deep",
      )}
    >
      {content}
    </li>
  );

  let index = -1;
  const groups: Array<{ key: string; label: string; items: React.ReactNode[] }> = [];
  if (!trimmed && recent.length) {
    groups.push({
      key: "recent",
      label: "Căutări recente",
      items: options
        .filter((o) => o.kind === "recent")
        .map((o) => {
          index++;
          return renderOption(
            o,
            index,
            <>
              <History aria-hidden className="size-4 shrink-0 text-ink-muted" />
              <span className="flex-1 truncate">{o.kind === "recent" ? o.query : null}</span>
            </>,
          );
        }),
    });
  }
  data?.groups.forEach((group) => {
    groups.push({
      key: group.type,
      label: group.label,
      items: options
        .filter((o) => o.kind === "hit" && o.group === group.type)
        .map((o) => {
          index++;
          if (o.kind !== "hit") return null;
          const price = typeof o.hit.meta?.price === "number" ? o.hit.meta.price : null;
          return renderOption(
            o,
            index,
            <>
              <HitVisual hit={o.hit} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold text-ink">{o.hit.title}</span>
                {o.hit.subtitle ? (
                  <span className="truncate text-sm text-ink-muted">{o.hit.subtitle}</span>
                ) : null}
              </span>
              {price != null ? (
                <span className="shrink-0 text-sm font-semibold">{formatMoney(price)}</span>
              ) : null}
            </>,
          );
        }),
    });
  });

  const allOption = options.find((o) => o.kind === "all");

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-[2px] data-[state=closed]:animate-overlay-out data-[state=open]:animate-overlay-in" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            setRecent(readRecent());
            inputRef.current?.focus();
          }}
          className="fixed inset-0 z-50 flex flex-col bg-paper focus:outline-none data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in md:inset-x-0 md:top-[9vh] md:bottom-auto md:mx-auto md:max-h-[78vh] md:w-[min(42rem,calc(100vw-2rem))] md:rounded-2xl md:border md:border-line md:bg-surface md:shadow-overlay"
        >
          <DialogPrimitive.Title className="sr-only">Caută în magazin</DialogPrimitive.Title>
          <div className="flex items-center gap-3 border-b border-line px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 md:px-5 md:py-4">
            <Search aria-hidden className="size-5 shrink-0 text-ink-muted" />
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={options.length > 0}
              aria-controls={listId}
              aria-activedescendant={options[activeIndex]?.id}
              aria-autocomplete="list"
              aria-label="Caută produse, categorii și etichete"
              placeholder="Caută: lavandă, citrice, difuzor…"
              autoComplete="off"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              className="h-11 min-w-0 flex-1 bg-transparent text-lg text-ink placeholder:text-ink-muted/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {loading ? <Spinner className="size-5 text-ink-muted" /> : null}
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                className="grid size-9 place-items-center rounded-full text-ink-muted hover:bg-paper-deep hover:text-ink"
                aria-label="Șterge căutarea"
              >
                <X aria-hidden className="size-4" />
              </button>
            ) : null}
            <DialogPrimitive.Close className="rounded-full px-3 py-1.5 text-sm font-semibold text-ink-muted hover:bg-paper-deep hover:text-ink md:hidden">
              Închide
            </DialogPrimitive.Close>
            <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-xs text-ink-muted md:inline">
              Esc
            </kbd>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2 md:p-3">
            <p className="sr-only" aria-live="polite">
              {trimmed && !stale && !loading ? pluralRo(resultCount, "rezultat", "rezultate") : ""}
            </p>
            {error ? (
              <p className="px-3 py-8 text-center text-ink-muted">
                Căutarea nu a funcționat. Încearcă din nou.
              </p>
            ) : null}
            {trimmed && !stale && !loading && resultCount === 0 && !error ? (
              <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
                <p className="font-display text-xl">Nu am găsit nimic pentru „{trimmed}”</p>
                <p className="text-sm text-ink-muted">
                  Încearcă un alt cuvânt: o aromă, o plantă sau un moment al zilei.
                </p>
              </div>
            ) : null}
            <ul
              id={listId}
              role="listbox"
              aria-label="Sugestii de căutare"
              className="flex flex-col gap-3"
            >
              {groups.map((group) =>
                group.items.length ? (
                  <li key={group.key} role="presentation">
                    <p
                      id={`${id}-g-${group.key}`}
                      className="px-3 pt-1 pb-1.5 text-eyebrow text-ink-muted"
                    >
                      {group.label}
                    </p>
                    <ul
                      role="group"
                      aria-labelledby={`${id}-g-${group.key}`}
                      className="flex flex-col"
                    >
                      {group.items}
                    </ul>
                  </li>
                ) : null,
              )}
              {allOption ? (
                <li role="presentation">
                  <ul role="group" aria-label="Toate rezultatele">
                    {renderOption(
                      allOption,
                      options.length - 1,
                      <>
                        <ArrowRight aria-hidden className="size-4 text-forest" />
                        <span className="flex-1 font-semibold text-forest">
                          Vezi toate rezultatele pentru „{trimmed}”
                        </span>
                        <CornerDownLeft aria-hidden className="size-4 text-ink-muted" />
                      </>,
                    )}
                  </ul>
                </li>
              ) : null}
            </ul>
          </div>

          <div className="hidden items-center gap-4 border-t border-line px-5 py-2.5 text-xs text-ink-muted md:flex">
            <span>
              <kbd className="font-sans font-semibold">↑↓</kbd> navighează
            </span>
            <span>
              <kbd className="font-sans font-semibold">Enter</kbd> deschide
            </span>
            <span>
              <kbd className="font-sans font-semibold">Ctrl K</kbd> deschide căutarea oricând
            </span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
