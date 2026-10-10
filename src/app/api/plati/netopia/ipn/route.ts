import { handleNetopiaIpn } from "@/services/payments/netopia-service";

/**
 * NETOPIA Payments IPN (notifyUrl). The only place a card payment is
 * recorded: the signed notification is verified against the exact raw body
 * before anything is read from it. NETOPIA expects a JSON reply; a temporary
 * error makes it retry later.
 */
export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer());
  const reply = await handleNetopiaIpn(request.headers.get("verification-token"), rawBody);
  return Response.json(reply);
}
