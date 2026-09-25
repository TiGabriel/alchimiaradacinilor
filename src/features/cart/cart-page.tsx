"use client";

import { AlertCircle, ArrowRight, Lock, TicketPercent } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/features/catalog/product-card";
import { pluralRo } from "@/lib/plural";

import { useCart } from "./cart-context";
import { CartLine } from "./cart-line";
import { SUGGESTIONS_TITLE, useCartSuggestions } from "./cart-suggestions";
import { CartSummary } from "./cart-summary";
import { FreeShippingProgress } from "./free-shipping-progress";

export function CartPage() {
  const { cart } = useCart();
  const suggestions = useCartSuggestions();

  if (cart === null) {
    return (
      <div
        className="grid gap-10 lg:grid-cols-[1fr_22rem]"
        role="status"
        aria-label="Se încarcă coșul"
      >
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="aspect-[4/5] w-24 rounded-md" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        size="lg"
        title="Coșul tău este gol"
        description="Încă nu ai adăugat niciun produs. Descoperă aromele care ți se potrivesc."
        actions={
          <>
            <Button asChild>
              <Link href="/produse">Descoperă produsele</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/favorite">Vezi favoritele</Link>
            </Button>
          </>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-14">
        <section aria-labelledby="cart-items">
          <h2 id="cart-items" className="sr-only">
            Produse în coș
          </h2>
          {cart.hasIssues ? (
            <p
              className="mb-4 flex items-start gap-2 rounded-lg bg-warning-soft p-4 text-sm text-warning"
              role="status"
            >
              <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              Unele produse și-au schimbat disponibilitatea. Am actualizat coșul — verifică-l
              înainte de a continua.
            </p>
          ) : null}
          <FreeShippingProgress cart={cart} className="mb-2" />
          <ul className="divide-y divide-line border-b border-line">
            {cart.lines.map((line) => (
              <CartLine key={line.productId} line={line} variant="full" />
            ))}
          </ul>
          <Button asChild variant="link" className="mt-6">
            <Link href="/produse">← Continuă cumpărăturile</Link>
          </Button>
        </section>

        <aside aria-labelledby="cart-summary" className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-6 shadow-xs">
            <h2 id="cart-summary" className="text-2xl">
              Sumar comandă
            </h2>
            <p className="-mt-3 text-sm text-ink-muted">
              {pluralRo(cart.itemCount, "produs", "produse")}
            </p>
            <div className="flex flex-col gap-2">
              <label htmlFor="cupon" className="flex items-center gap-2 text-sm font-semibold">
                <TicketPercent aria-hidden className="size-4 text-forest" /> Cod de reducere
              </label>
              <div className="flex gap-2">
                <input
                  id="cupon"
                  disabled
                  placeholder="În curând"
                  aria-describedby="cupon-hint"
                  className="h-10 min-w-0 flex-1 rounded-md border border-line bg-paper-deep px-3 text-sm disabled:cursor-not-allowed"
                />
                <Button size="sm" variant="outline" disabled className="h-10">
                  Aplică
                </Button>
              </div>
              <p id="cupon-hint" className="text-xs text-ink-muted">
                Codurile de reducere vor putea fi folosite în curând.
              </p>
            </div>
            <CartSummary cart={cart} />
            <Button asChild size="lg" block>
              <Link href="/finalizare-comanda">
                Finalizează comanda <ArrowRight aria-hidden />
              </Link>
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
              <Lock aria-hidden className="size-3.5" /> Prețurile și stocul sunt verificate la
              fiecare pas.
            </p>
          </div>
        </aside>
      </div>

      {suggestions.length > 0 ? (
        <section aria-labelledby="cart-suggestions-page">
          <h2 id="cart-suggestions-page" className="mb-8 text-display-md">
            {SUGGESTIONS_TITLE}
          </h2>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6">
            {suggestions.map((p) => (
              <li key={p.id}>
                <ProductCard product={p} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
