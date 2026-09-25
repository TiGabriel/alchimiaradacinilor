import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartView } from "@/services/cart/cart";

/** Subtotal / discounts / shipping / total. Figures come from the server-side calculation. */
export function CartSummary({ cart, className }: { cart: CartView; className?: string }) {
  return (
    <dl className={cn("flex flex-col gap-2 text-[0.9375rem]", className)}>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(cart.subtotal)}</dd>
      </div>
      {cart.discounts.map((d) => (
        <div key={d.label} className="flex justify-between gap-4 text-clay">
          <dt>{d.label}</dt>
          <dd className="tabular-nums">−{formatMoney(d.amount)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-4">
        <dt className="text-ink-muted">Livrare</dt>
        <dd className="tabular-nums">
          {cart.itemCount === 0
            ? "—"
            : cart.shipping === 0
              ? "Gratuită"
              : formatMoney(cart.shipping)}
        </dd>
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-3">
        <dt className="font-semibold">Total</dt>
        <dd className="text-xl font-semibold tabular-nums">{formatMoney(cart.total)}</dd>
      </div>
      <p className="text-xs text-ink-muted">Prețurile includ TVA.</p>
    </dl>
  );
}
