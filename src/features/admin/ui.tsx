import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function AdminPageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="flex flex-col gap-3">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 self-start text-sm font-semibold text-forest hover:underline"
        >
          <ChevronLeft aria-hidden className="size-4" /> {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
          {description ? <p className="text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function AdminCard({
  title,
  children,
  className,
  actions,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 md:p-6",
        className,
      )}
    >
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title ? <h2 className="font-display text-xl">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Scrollable table wrapper (tables keep their semantics on small screens). */
export function AdminTable({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export const th = "px-4 py-3 text-xs font-bold tracking-wide text-ink-muted uppercase";
export const td = "px-4 py-3 align-middle";

/** GET search/filter bar: works without JavaScript, keeps the URL shareable. */
export function AdminSearchForm({
  action,
  query,
  placeholder,
  children,
}: {
  action: string;
  query?: string;
  placeholder: string;
  children?: React.ReactNode;
}) {
  return (
    <form action={action} role="search" className="flex flex-wrap items-end gap-3">
      <div className="relative min-w-60 flex-1">
        <label htmlFor="admin-q" className="sr-only">
          Caută
        </label>
        <Search
          aria-hidden
          className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          id="admin-q"
          name="q"
          type="search"
          defaultValue={query}
          placeholder={placeholder}
          className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-sm focus-visible:border-forest focus-visible:ring-4 focus-visible:ring-forest/12 focus-visible:outline-none"
        />
      </div>
      {children}
      <button
        type="submit"
        className="h-10 rounded-md bg-forest px-4 text-sm font-semibold text-ink-inverse hover:bg-forest-deep"
      >
        Filtrează
      </button>
    </form>
  );
}

export const adminSelect =
  "h-10 rounded-md border border-line-strong bg-surface px-3 text-sm focus-visible:border-forest focus-visible:ring-4 focus-visible:ring-forest/12 focus-visible:outline-none";

export function AdminPagination({
  page,
  pageCount,
  href,
}: {
  page: number;
  pageCount: number;
  href: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const link =
    "inline-flex h-9 items-center gap-1 rounded-md border border-line px-3 text-sm font-semibold hover:bg-paper-deep";
  return (
    <nav aria-label="Paginare" className="flex items-center justify-between gap-3 text-sm">
      {page > 1 ? (
        <Link href={href(page - 1)} className={link} rel="prev">
          <ChevronLeft aria-hidden className="size-4" /> Anterior
        </Link>
      ) : (
        <span />
      )}
      <span className="text-ink-muted">
        Pagina {page} din {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={link} rel="next">
          Următor <ChevronRight aria-hidden className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

export function StatusDot({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "off" | "danger";
  children: React.ReactNode;
}) {
  const colors = {
    ok: "bg-success",
    warn: "bg-warning",
    off: "bg-ink-muted/50",
    danger: "bg-danger",
  } as const;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span aria-hidden className={cn("size-2 rounded-full", colors[tone])} />
      {children}
    </span>
  );
}
