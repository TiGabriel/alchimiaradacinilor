# Payments

The shop launches with two **offline** methods, configured in the `payment` site setting
(`src/validation/settings.ts`):

| Method                                | When it is offered                                                  | What the customer sees                                                    |
| ------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Plată la livrare (`CASH_ON_DELIVERY`) | `payment.cashOnDelivery.enabled`                                    | "Vei plăti X la primirea coletului."                                      |
| Transfer bancar (`BANK_TRANSFER`)     | `payment.bankTransfer.enabled` **and** `accountHolder` + `iban` set | Amount, beneficiary, IBAN, bank and the order number as payment reference |

Card payments are **not** simulated anywhere. `PaymentMethod.CARD` exists in the schema but no
provider is registered, so checkout never offers it and `placeOrder` rejects it.

## How it fits together

- `src/services/payments/methods.ts` — the `PaymentProvider` interface, the two offline providers
  and the registry (`paymentProviders`). Pure and unit-tested.
- `placeOrder` (`src/services/orders/place.ts`) checks `provider.isAvailable(settings)`, creates the
  order inside a transaction (status `PENDING`, payment `UNPAID`), then calls
  `provider.start(order, settings)` **after** the transaction commits:
  - `{ kind: "offline", instructions }` → the customer lands on the confirmation page, which shows
    the instructions (also included in the confirmation email when email is configured);
  - `{ kind: "redirect", url }` → the checkout action redirects the browser to `url` (hosted
    payment page).
- `markOrderPaid(orderId, actorId)` (`src/services/orders/orders.ts`) records a confirmed payment
  and appends a history event. For bank transfers the admin calls it (Phase 11 order screen).

## Adding card payments (Stripe or Netopia)

1. **Credentials** — add the keys to `src/lib/env.ts` (server-only, optional) and document them in
   `.env.example`:
   - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
   - Netopia (mobilPay): `NETOPIA_API_KEY`, `NETOPIA_POS_SIGNATURE`, `NETOPIA_SANDBOX=true|false`.
2. **Provider** — implement `PaymentProvider` in `src/services/payments/<provider>.ts`:
   - `method: "CARD"`;
   - `isAvailable` → true only when the credentials are present (and, optionally, a
     `payment.card.enabled` setting you add to the registry);
   - `start(order)` → create a Checkout Session (Stripe) or a payment request (Netopia) for
     `order.total` in `order.currency`, with the order number as reference and success/cancel URLs
     pointing to `/finalizare-comanda/confirmare/<number>`; return `{ kind: "redirect", url }`.
     Never send an amount computed on the client — use the order's stored `total`.
   - Register it in `paymentProviders`.
3. **Webhook** — add a route handler, e.g. `src/app/api/plati/<provider>/route.ts`:
   - verify the signature (Stripe: `stripe.webhooks.constructEvent` with the raw body; Netopia:
     the IPN signature), and reject anything unsigned;
   - look the order up by the reference you sent, check that the paid amount and currency equal the
     stored `total`/`currency`, and call `markOrderPaid(order.id, null)`;
   - make it idempotent (a webhook may be delivered more than once; ignore orders already `PAID`);
   - on failure/expiry, set `paymentStatus: FAILED` and consider cancelling with
     `changeOrderStatus(..., "CANCELLED")`, which also returns the items to stock.
4. **Unpaid card orders** — stock is reserved when the order is created. Add a scheduled job that
   cancels card orders still `UNPAID` after a timeout (e.g. 60 minutes) using `changeOrderStatus`.
5. **Tests** — unit-test the provider's request building and the webhook's verification and amount
   checks; integration-test `markOrderPaid` idempotency.
6. **Legal** — update the Terms (payment section) and the privacy policy (the payment processor is a
   data processor), and bump their versions in the `legal` setting.

## VAT

Catalogue prices include VAT. Orders store the VAT contained in the total (`taxTotal`), computed
with `tax.vatRatePercent` (default 21%). Confirm the rate — and whether the company is a VAT payer
at all (set 0 if not) — with the accountant before launch.
