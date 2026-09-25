"use client";

import { TicketPercent, X } from "lucide-react";
import { useId, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CartView } from "@/services/cart/cart";

import { applyCouponAction, removeCouponAction } from "./actions";
import { useCart } from "./cart-context";

/** Apply/remove a discount code. The server validates it and recomputes every total. */
export function CouponForm({
  className,
  coupon: couponOverride,
  onUpdated,
}: {
  className?: string;
  /** Coupon state from a view other than the cart context (checkout summary). */
  coupon?: CartView["coupon"];
  /** Called after the code was applied or removed (e.g. to re-price the checkout). */
  onUpdated?: () => void;
}) {
  const { cart, applyCart } = useCart();
  const id = useId();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const coupon = couponOverride !== undefined ? couponOverride : (cart?.coupon ?? null);

  const apply = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    start(async () => {
      const result = await applyCouponAction(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setCode("");
      applyCart(result.cart, { openDrawer: false });
      onUpdated?.();
    });
  };

  const remove = () =>
    start(async () => {
      const result = await removeCouponAction();
      if (result.ok) {
        applyCart(result.cart, { openDrawer: false });
        onUpdated?.();
      }
    });

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {coupon ? (
        <div className="flex flex-col gap-1.5" aria-live="polite">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <TicketPercent aria-hidden className="size-4 text-forest" /> Cod de reducere
          </p>
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
              coupon.applied ? "border-forest/30 bg-forest-soft/60" : "border-clay/40 bg-clay/5",
            )}
          >
            <span className="font-semibold tracking-wide">{coupon.code}</span>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-sm text-ink-muted hover:text-ink"
            >
              <X aria-hidden className="size-4" /> Elimină
              <span className="sr-only"> codul {coupon.code}</span>
            </button>
          </div>
          {coupon.message ? <p className="text-sm text-clay">{coupon.message}</p> : null}
        </div>
      ) : (
        <form onSubmit={apply} className="flex flex-col gap-2" noValidate>
          <label htmlFor={id} className="flex items-center gap-2 text-sm font-semibold">
            <TicketPercent aria-hidden className="size-4 text-forest" /> Cod de reducere
          </label>
          <div className="flex gap-2">
            <Input
              id={id}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className="h-10 min-w-0 flex-1 uppercase placeholder:normal-case"
              placeholder="Ai un cod?"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              loading={pending}
              disabled={!code.trim()}
              className="h-10"
            >
              Aplică
            </Button>
          </div>
          <p id={`${id}-error`} aria-live="polite" className="text-sm text-danger empty:hidden">
            {error}
          </p>
        </form>
      )}
    </div>
  );
}
