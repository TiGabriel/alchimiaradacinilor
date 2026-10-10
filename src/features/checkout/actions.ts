"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { limiters, retryAfterText } from "@/services/auth/rate-limit";
import { loadCartView, type CartView } from "@/services/cart/cart";
import { CheckoutError, placeOrder, type CheckoutErrorCode } from "@/services/orders/place";
import { ORDER_NUMBER_PATTERN } from "@/services/orders/status";
import {
  payableCardOrder,
  PaymentStartError,
  startNetopiaPayment,
} from "@/services/payments/netopia-service";
import { checkoutSchema, quoteSchema } from "@/validation/checkout";

import { requireUser } from "../auth/session";

export type QuoteResult = { ok: true; cart: CartView } | { ok: false; error: string };

/** Totals for the chosen delivery method, recomputed on the server. */
export async function quoteCheckoutAction(shippingMethod: string): Promise<QuoteResult> {
  const parsed = quoteSchema.safeParse({ shippingMethod });
  if (!parsed.success) return { ok: false, error: "Alege o metodă de livrare." };
  const { user } = await requireUser("/finalizare-comanda");
  return {
    ok: true,
    cart: await loadCartView({ userId: user.id, token: null }, { methodCode: shippingMethod }),
  };
}

export type PlaceOrderResult = {
  ok: false;
  error: string;
  code?: CheckoutErrorCode | "invalid";
  /** Field errors keyed by path ("shipping.address.phone"). */
  fieldErrors?: Record<string, string>;
  /** Fresh totals when prices, stock or the coupon changed. */
  cart?: CartView;
};

export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  const { user } = await requireUser("/finalizare-comanda");
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
    return {
      ok: false,
      code: "invalid",
      error: "Verifică datele marcate și încearcă din nou.",
      fieldErrors,
    };
  }

  const limit = limiters.checkoutByUser.check(`checkout:${user.id}`);
  if (!limit.allowed)
    return {
      ok: false,
      error: `Prea multe încercări. Mai încearcă peste ${retryAfterText(limit.retryAfterMs)}.`,
    };

  let destination: string;
  try {
    const placed = await placeOrder(user.id, parsed.data);
    destination =
      placed.payment.kind === "redirect"
        ? placed.payment.url
        : `/finalizare-comanda/confirmare/${placed.number}${placed.payment.kind === "retry" ? "?plata=neinitiata" : ""}`;
  } catch (error) {
    if (error instanceof CheckoutError) {
      const refresh = ["price-changed", "stock", "coupon", "shipping"].includes(error.code);
      return {
        ok: false,
        code: error.code,
        error: error.message,
        cart: refresh
          ? await loadCartView(
              { userId: user.id, token: null },
              { methodCode: parsed.data.shippingMethod },
            )
          : undefined,
      };
    }
    console.error("[checkout]", error);
    return {
      ok: false,
      error: "Nu am putut plasa comanda. Te rugăm să încerci din nou.",
    };
  }
  redirect(destination);
}

const orderNumberSchema = z.string().regex(ORDER_NUMBER_PATTERN);

/** Opens a new card payment attempt for the customer's own unpaid card order. */
export async function retryCardPaymentAction(number: unknown): Promise<{ error: string }> {
  const parsed = orderNumberSchema.safeParse(number);
  if (!parsed.success) return { error: "Comanda nu a fost găsită." };
  const { user } = await requireUser(`/finalizare-comanda/confirmare/${parsed.data}`);
  const limit = limiters.checkoutByUser.check(`checkout:${user.id}`);
  if (!limit.allowed)
    return {
      error: `Prea multe încercări. Mai încearcă peste ${retryAfterText(limit.retryAfterMs)}.`,
    };

  const order = await payableCardOrder(user.id, parsed.data);
  if (!order) return { error: "Această comandă nu mai poate fi plătită cu cardul." };
  let url: string;
  try {
    const start = await startNetopiaPayment(order.id);
    if (start.kind !== "redirect") throw new PaymentStartError("Unexpected payment start.");
    url = start.url;
  } catch (error) {
    if (!(error instanceof PaymentStartError)) console.error("[checkout] card retry", error);
    return { error: "Plata cu cardul nu poate fi inițiată acum. Te rugăm să încerci mai târziu." };
  }
  redirect(url);
}
