"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { pluralRo } from "@/lib/plural";

import { useCart } from "./cart-context";
import { CartLine } from "./cart-line";
import { CartSuggestionsCompact } from "./cart-suggestions";
import { CartSummary } from "./cart-summary";
import { FreeShippingProgress } from "./free-shipping-progress";

export function CartDrawer() {
  const { cart, drawerOpen, setDrawerOpen } = useCart();
  const close = () => setDrawerOpen(false);
  const empty = cart !== null && cart.lines.length === 0;

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerContent
        side="right"
        title={
          <span className="inline-flex items-baseline gap-2">
            Coșul tău
            {cart && cart.itemCount > 0 ? (
              <span className="font-sans text-sm font-semibold text-ink-muted">
                {pluralRo(cart.itemCount, "produs", "produse")}
              </span>
            ) : null}
          </span>
        }
        footer={
          cart && !empty ? (
            <div className="flex flex-col gap-4">
              <CartSummary cart={cart} />
              <div className="flex flex-col gap-2">
                <Button asChild size="lg" block>
                  <Link href="/finalizare-comanda" onClick={close}>
                    Finalizează comanda <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <DrawerClose asChild>
                  <Button asChild variant="ghost" block>
                    <Link href="/cos">Vezi coșul</Link>
                  </Button>
                </DrawerClose>
              </div>
            </div>
          ) : undefined
        }
      >
        {cart === null ? (
          <div className="flex flex-col gap-4 pt-2" role="status" aria-label="Se încarcă coșul">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="aspect-[4/5] w-20 rounded-md" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : empty ? (
          <EmptyState
            size="md"
            title="Coșul tău este gol"
            description="Descoperă uleiurile și ritualurile care ți se potrivesc."
            actions={
              <DrawerClose asChild>
                <Button asChild>
                  <Link href="/produse">Descoperă produsele</Link>
                </Button>
              </DrawerClose>
            }
          />
        ) : (
          <div className="flex flex-col gap-2">
            <FreeShippingProgress cart={cart} />
            <ul className="divide-y divide-line">
              {cart.lines.map((line) => (
                <CartLine key={line.productId} line={line} onNavigate={close} />
              ))}
            </ul>
            <CartSuggestionsCompact onNavigate={close} />
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}
