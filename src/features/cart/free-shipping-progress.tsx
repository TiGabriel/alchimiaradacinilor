"use client";

import { Truck } from "lucide-react";

import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartView } from "@/services/cart/cart";

/** "Mai adaugă X pentru livrare gratuită" with a progress bar. */
export function FreeShippingProgress({ cart, className }: { cart: CartView; className?: string }) {
  if (cart.itemCount === 0 || cart.freeShippingThreshold == null) return null;
  const reached = cart.freeShipping;
  const progress = reached
    ? 100
    : Math.min(
        100,
        Math.round(
          ((cart.freeShippingThreshold - (cart.freeShippingRemaining ?? 0)) /
            cart.freeShippingThreshold) *
            100,
        ),
      );

  return (
    <div className={cn("flex flex-col gap-2 rounded-lg bg-forest-soft/60 p-3.5", className)}>
      <p className="flex items-center gap-2 text-sm text-forest-deep">
        <Truck aria-hidden className="size-4 shrink-0" />
        {reached ? (
          <span className="font-semibold">Livrarea este gratuită pentru comanda ta.</span>
        ) : (
          <span>
            Mai adaugă <strong>{formatMoney(cart.freeShippingRemaining ?? 0)}</strong> pentru
            livrare gratuită.
          </span>
        )}
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-label="Progres către livrarea gratuită"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full rounded-full bg-forest transition-[width] duration-700 ease-(--ease-botanical)"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
