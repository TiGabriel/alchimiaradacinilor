# Payments

The shop has two **offline** methods and card payment through **NETOPIA Payments**, configured in
the `payment` site setting (`src/validation/settings.ts`):

| Method                                | When it is offered                                                  | What the customer sees                                                    |
| ------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Plată la livrare (`CASH_ON_DELIVERY`) | `payment.cashOnDelivery.enabled`                                    | "Vei plăti X la primirea coletului."                                      |
| Transfer bancar (`BANK_TRANSFER`)     | `payment.bankTransfer.enabled` **and** `accountHolder` + `iban` set | Amount, beneficiary, IBAN, bank and the order number as payment reference |
| Card bancar (`CARD`)                  | `payment.card.enabled` **and** every `NETOPIA_*` variable set       | Redirect to NETOPIA's hosted card page; status from the signed IPN        |

Card payments are **never** simulated: an order becomes `PAID` only from a verified NETOPIA
notification. Until the client's merchant account exists, the `NETOPIA_*` variables are empty and
checkout does not offer the method.

## How it fits together

- `src/services/payments/methods.ts` — the `PaymentProvider` interface, the two offline providers
  and `createCardProvider`. Pure and unit-tested.
- `src/services/payments/registry.ts` — the providers in display order (offline + NETOPIA card);
  `providerFor` / `availablePaymentOptions` are imported from here by checkout and orders.
- `placeOrder` (`src/services/orders/place.ts`) checks `provider.isAvailable(settings)`, creates the
  order inside a transaction (status `PENDING`, payment `UNPAID`, stock reserved), then calls
  `provider.start(order, settings)` **after** the transaction commits:
  - `{ kind: "offline", instructions }` → the confirmation page shows the instructions (also in the
    confirmation email);
  - `{ kind: "redirect", url }` → the checkout action redirects the browser to NETOPIA's page;
  - `{ kind: "retry", message }` → NETOPIA could not be reached; the order is kept and the customer
    lands on its page, which offers **Plătește cu cardul** again.
- `markOrderPaid(orderId, actorId)` (`src/services/orders/orders.ts`) records a confirmed bank
  transfer (admin).

## Card payments (NETOPIA Payments, API v2)

Implemented against NETOPIA's OpenAPI spec (`https://secure.sandbox.netopia-payments.com/spec`) and
their official SDKs (PHP `netopia/payment2`, Go, Python) for the IPN verification.

| Piece                                                     | Where                                          |
| --------------------------------------------------------- | ---------------------------------------------- |
| Request building, IPN verification, status mapping (pure) | `src/services/payments/netopia.ts`             |
| Start payment, apply IPN, retry (server)                  | `src/services/payments/netopia-service.ts`     |
| IPN endpoint (`notifyUrl`)                                | `POST /api/plati/netopia/ipn`                  |
| Customer return (`redirectUrl`, `cancelUrl`)              | `GET/POST /api/plati/netopia/retur?comanda=…`  |
| Retry button                                              | `src/features/checkout/retry-card-payment.tsx` |
| Admin toggle and status                                   | Admin → Setări → Plată → Card bancar           |

**Start.** `POST {base}/payment/card/start` with the `Authorization: <API key>` header. The body
carries the order's **stored** total (bani → RON with two decimals), billing/shipping snapshots
(country 642), the products and `instrument: { type: "card" }` — **no card data**: the customer
types it on NETOPIA's page, so the shop never sees or stores card numbers or CVVs. Each attempt has
its own NETOPIA order id, `<order number>_<random>`, because NETOPIA rejects a reused id. The
response's `payment.paymentURL` (https only) is where the browser goes; `payment.ntpID` is stored
as `Order.paymentReference`, with `Order.paymentProvider = "netopia"`.

Base URLs (from the spec's `servers`): sandbox `https://secure.sandbox.netopia-payments.com`, live
`https://secure.mobilpay.ro/pay`, chosen by `NETOPIA_ENV`.

**IPN.** NETOPIA posts JSON with a `Verification-token` header (JWT). Before reading anything from
the body, the handler:

1. verifies the RSA signature (RS256/384/512) with `NETOPIA_PUBLIC_KEY` (certificate or public key);
2. checks `iss = "NETOPIA Payments"`, `aud = NETOPIA_POS_SIGNATURE`, `exp`/`nbf` (seconds or
   milliseconds, 5 minutes of leeway);
3. checks `sub = base64(sha512(raw body))`, so the body cannot be altered;
4. parses the payload with Zod, finds the order from `order.orderID` and locks it (`FOR UPDATE`).

Then, only forward and idempotently:

| NETOPIA status                                 | Effect                                                                     |
| ---------------------------------------------- | -------------------------------------------------------------------------- |
| 3 paid, 5 confirmed                            | `PAID` + `paidAt` — only if amount **and** currency equal the stored total |
| 4 cancelled, 11 error, 12 declined, 23 expired | `FAILED` — only if still `UNPAID` (never overrides a payment)              |
| 8 credit (refund)                              | `REFUNDED` — only if `PAID`                                                |
| anything else (1, 2, 6, 13, 14, 15…)           | no change (interim)                                                        |

Each change appends an order history event (shown to the customer; sandbox events say it was a
test payment). Duplicates change nothing. The reply is the JSON NETOPIA expects
(`{ errorType, errorCode, errorMessage }`): `errorType 1` (temporary — NETOPIA retries) when the
database fails, `2` (permanent) for a bad signature, an unknown order or an amount mismatch (logged
for investigation). A payment that arrives for an order already cancelled is recorded and logged so
it can be refunded from NETOPIA's dashboard.

**Return.** The customer's return proves nothing. `/api/plati/netopia/retur` only redirects (303)
to the order's confirmation page, which shows the status recorded from the IPN: "Așteptăm
confirmarea plății…" until it arrives, then paid or failed (with a retry button for failed or
abandoned attempts).

### Activating card payments

1. The client signs the NETOPIA contract (KYC, company documents, the bank account for
   settlements — given to NETOPIA, never to the code) and creates a **point of sale** for
   `https://alchimiaradacinilor.ro` in `admin.netopia-payments.com`.
2. **Sandbox first.** From the NETOPIA admin's test environment take the sandbox API key
   (Profile → Security), the POS signature and the public certificate. Set them in a
   **non-production** environment with a public URL (a Netlify branch deploy with its own database,
   or a tunnel to a local server): `NETOPIA_ENV=sandbox`, `NETOPIA_API_KEY`,
   `NETOPIA_POS_SIGNATURE`, `NETOPIA_PUBLIC_KEY`, and `APP_URL` = that public URL. Tick
   **Card bancar** in Admin → Setări → Plată.
3. Test with NETOPIA's sandbox cards: a successful payment, a declined one, an abandoned page, a
   retry, and a duplicate IPN. Check the order history after each.
4. Update the Terms (payment section) and the privacy policy (NETOPIA as a processor) and bump
   their versions in the `legal` setting.
5. Ask `implementare@netopia.ro` for the final validation of the point of sale.
6. **Live.** In the production environment only: `NETOPIA_ENV=live` and the **live** API key, POS
   signature and public certificate. Redeploy (approval required), place one small real order, then
   refund it from the NETOPIA admin.

### Not done yet

- **Unpaid card orders keep their stock reserved.** Cancel abandoned ones from the admin
  (`changeOrderStatus(…, "CANCELLED")` returns the stock), or add a scheduled job that cancels card
  orders still `UNPAID`/`FAILED` after e.g. 60 minutes.
- Refunds are made from NETOPIA's dashboard; the shop records them when the credit IPN arrives.
- NETOPIA's `/operation/status` is marked "available at a future date" in their spec, so there is
  no status polling; the IPN is the only source of truth.

## VAT

Catalogue prices include VAT. Orders store the VAT contained in the total (`taxTotal`), computed
with `tax.vatRatePercent` (default 21%). Confirm the rate — and whether the company is a VAT payer
at all (set 0 if not) — with the accountant before launch.
