"use server";

import { redirect } from "next/navigation";

import { limiters, retryAfterText } from "@/services/auth/rate-limit";
import { loadCartView, type CartView } from "@/services/cart/cart";
import { CheckoutError, placeOrder, type CheckoutErrorCode } from "@/services/orders/place";
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
        : `/finalizare-comanda/confirmare/${placed.number}`;
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
