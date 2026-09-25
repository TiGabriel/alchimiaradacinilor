"use client";

import { AlertCircle, Trash2 } from "lucide-react";
import Link from "next/link";

import { ProductImage } from "@/components/media/product-image";
import { Price } from "@/components/ui/price";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartLineView } from "@/services/cart/cart";
import { productHref } from "@/services/catalog/product-types";

import { useCart } from "./cart-context";

function issueText(line: CartLineView) {
  if (line.issue === "unavailable") return "Produsul nu mai este disponibil.";
  if (line.issue === "out-of-stock") return "Produsul nu mai este în stoc.";
  if (line.issue === "quantity-reduced")
    return `Doar ${line.quantity} buc. în stoc — am ajustat cantitatea.`;
  return null;
}

type CartLineProps = { line: CartLineView; variant?: "compact" | "full"; onNavigate?: () => void };

export function CartLine({ line, variant = "compact", onNavigate }: CartLineProps) {
  const { pendingIds, setQuantity, removeItem } = useCart();
  const pending = pendingIds.has(line.productId);
  const issue = issueText(line);
  const buyable = line.issue !== "unavailable" && line.issue !== "out-of-stock";
  const full = variant === "full";

  return (
    <li
      className={cn(
        "flex gap-4 py-5 transition-opacity",
        pending && "opacity-60",
        !buyable && "opacity-80",
      )}
      aria-busy={pending || undefined}
    >
      <Link
        href={productHref(line)}
        onClick={onNavigate}
        className={cn("block shrink-0 overflow-hidden rounded-md", full ? "w-24 sm:w-28" : "w-20")}
        tabIndex={-1}
        aria-hidden
      >
        <ProductImage
          name={line.name}
          productType={line.productType}
          image={line.image}
          tone={line.tone}
          sizes="112px"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            {line.brandName ? (
              <span className="text-[0.6875rem] font-bold tracking-[0.14em] text-ink-muted uppercase">
                {line.brandName}
              </span>
            ) : null}
            <Link
              href={productHref(line)}
              onClick={onNavigate}
              className={cn(
                "font-display leading-snug hover:text-forest",
                full ? "text-xl" : "text-[1.0625rem]",
              )}
            >
              {line.name}
            </Link>
            <Price
              price={line.unitPrice}
              compareAtPrice={line.compareAtPrice}
              size="sm"
              showDiscountBadge={false}
            />
          </div>
          <button
            type="button"
            onClick={() => removeItem({ id: line.productId, name: line.name })}
            disabled={pending}
            className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-full text-ink-muted transition-colors hover:bg-paper-deep hover:text-danger"
            aria-label={`Elimină ${line.name} din coș`}
          >
            <Trash2 aria-hidden className="size-4" />
          </button>
        </div>
        {issue ? (
          <p className="flex items-start gap-1.5 text-sm text-warning" role="status">
            <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" /> {issue}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3">
          {buyable ? (
            <QuantitySelector
              size="sm"
              value={line.quantity}
              min={1}
              max={Math.max(1, Math.min(line.stock, 99))}
              onChange={(q) => setQuantity(line.productId, q)}
              disabled={pending}
              label={`Cantitate ${line.name}`}
            />
          ) : (
            <span />
          )}
          <span className="font-semibold tabular-nums">
            {buyable ? formatMoney(line.lineTotal) : "—"}
          </span>
        </div>
      </div>
    </li>
  );
}
