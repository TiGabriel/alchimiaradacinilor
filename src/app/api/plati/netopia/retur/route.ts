import { z } from "zod";

import { ORDER_NUMBER_PATTERN } from "@/services/orders/status";

const querySchema = z.object({ comanda: z.string().regex(ORDER_NUMBER_PATTERN) });

/**
 * Where NETOPIA sends the customer back after the hosted payment page (GET or
 * POST). It proves nothing about the payment — it only leads to the order
 * page, which shows the status recorded from the signed IPN.
 */
function backToOrder(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ comanda: url.searchParams.get("comanda") });
  const target = parsed.success
    ? `/finalizare-comanda/confirmare/${parsed.data.comanda}`
    : "/cont/comenzi";
  return Response.redirect(new URL(target, url.origin), 303);
}

export const GET = backToOrder;
export const POST = backToOrder;
