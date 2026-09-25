"use client";

import { AlertCircle, Check, Lock, MapPin, Pencil, Plus, Truck, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";

import { ProductImage } from "@/components/media/product-image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Textarea } from "@/components/ui/input";
import { RadioCards } from "@/components/ui/radio-cards";
import { CartSummary } from "@/features/cart/cart-summary";
import { CouponForm } from "@/features/cart/coupon-form";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { CartView } from "@/services/cart/cart";
import type { PaymentOption } from "@/services/payments/methods";
import type { ShippingMethod } from "@/validation/settings";

import { placeOrderAction, quoteCheckoutAction } from "./actions";
import {
  AddressFields,
  addressErrorsFrom,
  emptyAddress,
  validateAddress,
  type AddressDraft,
  type AddressErrors,
} from "./address-fields";

export type CheckoutAddress = {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  streetExtra: string | null;
  city: string;
  county: string;
  postalCode: string;
  companyName: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
};

type Props = {
  initialCart: CartView;
  addresses: CheckoutAddress[];
  methods: ShippingMethod[];
  freeShippingThreshold: number | null;
  paymentOptions: PaymentOption[];
  customer: { firstName: string; lastName: string; email: string };
};

type Step = 1 | 2 | 3 | 4;
const NEW = "new";

const addressLine = (a: CheckoutAddress) =>
  `${a.street}${a.streetExtra ? `, ${a.streetExtra}` : ""}, ${a.city}, jud. ${a.county}`;

function StepSection({
  step,
  current,
  reached,
  title,
  icon,
  summary,
  onEdit,
  children,
}: {
  step: Step;
  current: Step;
  reached: Step;
  title: string;
  icon: React.ReactNode;
  summary: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const open = current === step;
  const done = reached > step && !open;
  useEffect(() => {
    if (open && step > 1) headingRef.current?.focus();
  }, [open, step]);

  return (
    <section
      aria-labelledby={`pas-${step}`}
      className={cn(
        "rounded-xl border bg-surface p-5 shadow-xs transition-colors md:p-7",
        open ? "border-line-strong" : "border-line",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id={`pas-${step}`}
          ref={headingRef}
          tabIndex={-1}
          className={cn(
            "flex items-center gap-3 font-display text-xl outline-none md:text-2xl",
            !open && !done && "text-ink-muted",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "grid size-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
              done
                ? "bg-forest text-ink-inverse"
                : open
                  ? "bg-forest-soft text-forest"
                  : "bg-paper-deep text-ink-muted",
            )}
          >
            {done ? <Check className="size-4" /> : step}
          </span>
          <span className="sr-only">Pasul {step}: </span>
          {title}
        </h2>
        {done ? (
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil aria-hidden /> Modifică<span className="sr-only"> {title.toLowerCase()}</span>
          </Button>
        ) : (
          <span aria-hidden className="text-forest/60">
            {icon}
          </span>
        )}
      </div>
      {open ? <div className="mt-6">{children}</div> : null}
      {done ? <div className="mt-3 pl-11 text-sm text-ink-muted">{summary}</div> : null}
    </section>
  );
}

export function CheckoutFlow({
  initialCart,
  addresses,
  methods,
  freeShippingThreshold,
  paymentOptions,
  customer,
}: Props) {
  const formId = useId();
  const [step, setStep] = useState<Step>(1);
  const [reached, setReached] = useState<Step>(1);
  const [cart, setCart] = useState<CartView>(initialCart);

  const defaultShipping = addresses.find((a) => a.isDefaultShipping) ?? addresses[0];
  const [shippingChoice, setShippingChoice] = useState<string>(defaultShipping?.id ?? NEW);
  const [shippingDraft, setShippingDraft] = useState<AddressDraft>(() =>
    emptyAddress({ firstName: customer.firstName, lastName: customer.lastName }),
  );
  const [shippingCompany, setShippingCompany] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [shippingErrors, setShippingErrors] = useState<AddressErrors>({});

  const [billingSame, setBillingSame] = useState(true);
  const defaultBilling = addresses.find((a) => a.isDefaultBilling) ?? addresses[0];
  const [billingChoice, setBillingChoice] = useState<string>(defaultBilling?.id ?? NEW);
  const [billingDraft, setBillingDraft] = useState<AddressDraft>(() => emptyAddress());
  const [billingCompany, setBillingCompany] = useState(true);
  const [billingErrors, setBillingErrors] = useState<AddressErrors>({});

  const [method, setMethod] = useState(initialCart.shippingMethodCode);
  const [payment, setPayment] = useState(paymentOptions[0]?.method ?? "");
  const [note, setNote] = useState("");
  const [terms, setTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formErrorCode, setFormErrorCode] = useState<string | null>(null);
  const [quoting, startQuote] = useTransition();
  const [submitting, startSubmit] = useTransition();

  const go = (next: Step) => {
    setStep(next);
    setReached((r) => (next > r ? next : r));
  };

  const requote = (code = method) =>
    startQuote(async () => {
      const result = await quoteCheckoutAction(code);
      if (result.ok) setCart(result.cart);
    });

  // ── Step 1: addresses ───────────────────────────────────────────────────
  const resolveShipping = ():
    | { kind: "saved"; addressId: string }
    | { kind: "new"; address: AddressDraft; save: boolean }
    | null => {
    if (shippingChoice !== NEW) return { kind: "saved", addressId: shippingChoice };
    const result = validateAddress(shippingDraft, shippingCompany);
    setShippingErrors(result.ok ? {} : result.errors);
    return result.ok ? { kind: "new", address: result.input, save: saveAddress } : null;
  };
  const resolveBilling = ():
    | { kind: "same" }
    | { kind: "saved"; addressId: string }
    | { kind: "new"; address: AddressDraft }
    | null => {
    if (billingSame) return { kind: "same" };
    if (billingChoice !== NEW) return { kind: "saved", addressId: billingChoice };
    const result = validateAddress(billingDraft, billingCompany);
    setBillingErrors(result.ok ? {} : result.errors);
    return result.ok ? { kind: "new", address: result.input } : null;
  };

  const continueFromAddresses = () => {
    const shipping = resolveShipping();
    const billing = resolveBilling();
    if (!shipping || !billing) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(`#${CSS.escape(formId)} [aria-invalid="true"]`)
          ?.focus(),
      );
      return;
    }
    go(2);
  };

  const shippingSummary = () => {
    if (shippingChoice !== NEW) {
      const a = addresses.find((x) => x.id === shippingChoice);
      return a ? `${a.firstName} ${a.lastName}, ${addressLine(a)}` : "";
    }
    const d = shippingDraft;
    return `${d.firstName} ${d.lastName}, ${d.street}, ${d.city}, jud. ${d.county}`;
  };

  const addressOptions = (idPrefix: string) => [
    ...addresses.map((a) => ({
      value: a.id,
      title: (
        <span className="flex flex-wrap items-center gap-2">
          {a.label ?? `${a.firstName} ${a.lastName}`}
        </span>
      ),
      description: (
        <>
          {a.label ? `${a.firstName} ${a.lastName} · ` : ""}
          {addressLine(a)} · {a.phone}
        </>
      ),
      icon: <MapPin aria-hidden className="size-5" />,
    })),
    {
      value: NEW,
      title: "Adresă nouă",
      description: idPrefix === "shipping" ? "Completează o adresă de livrare." : undefined,
      icon: <Plus aria-hidden className="size-5" />,
    },
  ];

  // ── Step 2: delivery ────────────────────────────────────────────────────
  const chooseMethod = (code: string) => {
    setMethod(code);
    requote(code);
  };
  const selectedMethod = methods.find((m) => m.code === method);

  // ── Step 4: submit ──────────────────────────────────────────────────────
  const submit = () => {
    setFormError(null);
    setFormErrorCode(null);
    if (!terms) {
      setTermsError("Pentru a plasa comanda, acceptă termenii și politica de confidențialitate.");
      document.getElementById(`${formId}-terms`)?.focus();
      return;
    }
    const shipping = resolveShipping();
    const billing = resolveBilling();
    if (!shipping || !billing) {
      go(1);
      return;
    }
    startSubmit(async () => {
      const result = await placeOrderAction({
        shipping,
        billing,
        shippingMethod: method,
        paymentMethod: payment,
        note,
        acceptTerms: true,
        expectedTotal: cart.total,
      });
      // Success redirects to the confirmation page; we only get here on failure.
      if (!result) return;
      setFormError(result.error);
      setFormErrorCode(result.code ?? null);
      if (result.cart) setCart(result.cart);
      if (result.code === "invalid" && result.fieldErrors) {
        const shippingFieldErrors = addressErrorsFrom(result.fieldErrors, "shipping");
        const billingFieldErrors = addressErrorsFrom(result.fieldErrors, "billing");
        setShippingErrors(shippingFieldErrors);
        setBillingErrors(billingFieldErrors);
        if (Object.keys(shippingFieldErrors).length || Object.keys(billingFieldErrors).length)
          go(1);
      }
      if (result.code === "address") go(1);
      if (result.code === "shipping") go(2);
      if (result.code === "payment") go(3);
      requestAnimationFrame(() => document.getElementById(`${formId}-error`)?.focus());
    });
  };

  const paymentLabel = paymentOptions.find((p) => p.method === payment)?.label ?? "";

  return (
    <div id={formId} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-4">
        <StepSection
          step={1}
          current={step}
          reached={reached}
          title="Date de livrare"
          icon={<MapPin className="size-5" />}
          summary={
            <>
              {shippingSummary()}
              <br />
              Facturare: {billingSame ? "aceeași adresă" : "altă adresă"}
            </>
          }
          onEdit={() => go(1)}
        >
          <div className="flex flex-col gap-6">
            {addresses.length ? (
              <RadioCards
                aria-label="Adresa de livrare"
                value={shippingChoice}
                onValueChange={setShippingChoice}
                options={addressOptions("shipping")}
              />
            ) : null}
            {shippingChoice === NEW ? (
              <div className="flex flex-col gap-4">
                <AddressFields
                  idPrefix="shipping"
                  legend="Adresa de livrare"
                  value={shippingDraft}
                  errors={shippingErrors}
                  onChange={setShippingDraft}
                  company={shippingCompany}
                  onCompanyChange={setShippingCompany}
                />
                <Checkbox
                  id={`${formId}-save`}
                  checked={saveAddress}
                  onCheckedChange={(v) => setSaveAddress(v === true)}
                  label="Salvează adresa în contul meu"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-4 border-t border-line pt-5">
              <Checkbox
                id={`${formId}-billing-same`}
                checked={billingSame}
                onCheckedChange={(v) => setBillingSame(v === true)}
                label="Adresa de facturare este aceeași cu adresa de livrare"
              />
              {!billingSame ? (
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold">Adresa de facturare</h3>
                  {addresses.length ? (
                    <RadioCards
                      aria-label="Adresa de facturare"
                      value={billingChoice}
                      onValueChange={setBillingChoice}
                      options={addressOptions("billing")}
                    />
                  ) : null}
                  {billingChoice === NEW ? (
                    <AddressFields
                      idPrefix="billing"
                      legend="Adresa de facturare"
                      value={billingDraft}
                      errors={billingErrors}
                      onChange={setBillingDraft}
                      company={billingCompany}
                      onCompanyChange={setBillingCompany}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            <Button size="lg" onClick={continueFromAddresses} className="self-start">
              Continuă spre livrare
            </Button>
          </div>
        </StepSection>

        <StepSection
          step={2}
          current={step}
          reached={reached}
          title="Metoda de livrare"
          icon={<Truck className="size-5" />}
          summary={`${selectedMethod?.name ?? ""} · ${cart.shipping === 0 ? "gratuită" : formatMoney(cart.shipping)}`}
          onEdit={() => go(2)}
        >
          <div className="flex flex-col gap-6">
            <RadioCards
              aria-label="Metoda de livrare"
              value={method}
              onValueChange={chooseMethod}
              options={methods.map((m) => ({
                value: m.code,
                title: m.name,
                description: [
                  m.description,
                  m.freeShippingEligible && freeShippingThreshold != null
                    ? `Gratuită pentru comenzi de peste ${formatMoney(freeShippingThreshold)}.`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" "),
                icon: <Truck aria-hidden className="size-5" />,
                aside:
                  m.code === cart.shippingMethodCode && cart.shipping === 0
                    ? "Gratuită"
                    : m.price > 0
                      ? formatMoney(m.price)
                      : "Gratuită",
              }))}
            />
            <Button size="lg" onClick={() => go(3)} className="self-start" disabled={quoting}>
              Continuă spre plată
            </Button>
          </div>
        </StepSection>

        <StepSection
          step={3}
          current={step}
          reached={reached}
          title="Plata"
          icon={<Wallet className="size-5" />}
          summary={paymentLabel}
          onEdit={() => go(3)}
        >
          <div className="flex flex-col gap-6">
            <RadioCards
              aria-label="Metoda de plată"
              value={payment}
              onValueChange={setPayment}
              options={paymentOptions.map((p) => ({
                value: p.method,
                title: p.label,
                description: p.description,
                icon: <Wallet aria-hidden className="size-5" />,
              }))}
            />
            <p className="text-sm text-ink-muted">
              Plata online cu cardul nu este încă disponibilă.
            </p>
            <Button size="lg" onClick={() => go(4)} className="self-start" disabled={!payment}>
              Verifică comanda
            </Button>
          </div>
        </StepSection>

        <StepSection
          step={4}
          current={step}
          reached={reached}
          title="Verifică și trimite"
          icon={<Check className="size-5" />}
          summary={null}
          onEdit={() => go(4)}
        >
          <div className="flex flex-col gap-6">
            <dl className="grid gap-4 rounded-lg bg-paper-deep/60 p-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="font-semibold">Livrare la</dt>
                <dd className="text-ink-muted">{shippingSummary()}</dd>
              </div>
              <div>
                <dt className="font-semibold">Metodă de livrare</dt>
                <dd className="text-ink-muted">{selectedMethod?.name}</dd>
              </div>
              <div>
                <dt className="font-semibold">Plată</dt>
                <dd className="text-ink-muted">{paymentLabel}</dd>
              </div>
            </dl>

            <Field
              id={`${formId}-note`}
              label="Observații pentru comandă (opțional)"
              hint="De exemplu, un interval orar potrivit pentru livrare."
            >
              {(p) => (
                <Textarea
                  {...p}
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-20"
                />
              )}
            </Field>

            <div className="flex flex-col gap-1.5">
              <Checkbox
                id={`${formId}-terms`}
                checked={terms}
                aria-invalid={termsError ? true : undefined}
                aria-describedby={termsError ? `${formId}-terms-error` : undefined}
                onCheckedChange={(v) => {
                  setTerms(v === true);
                  if (v === true) setTermsError(null);
                }}
                label={
                  <>
                    Am citit și accept{" "}
                    <Link
                      href="/termeni-si-conditii"
                      target="_blank"
                      className="font-semibold text-forest underline underline-offset-2"
                    >
                      Termenii și condițiile
                    </Link>{" "}
                    și{" "}
                    <Link
                      href="/politica-de-confidentialitate"
                      target="_blank"
                      className="font-semibold text-forest underline underline-offset-2"
                    >
                      Politica de confidențialitate
                    </Link>
                    .
                  </>
                }
              />
              {termsError ? (
                <p id={`${formId}-terms-error`} className="pl-8 text-sm font-medium text-danger">
                  {termsError}
                </p>
              ) : null}
            </div>
          </div>
        </StepSection>

        {formError ? (
          <div
            id={`${formId}-error`}
            role="alert"
            tabIndex={-1}
            className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm outline-none"
          >
            <AlertCircle aria-hidden className="mt-0.5 size-5 shrink-0 text-danger" />
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-ink">{formError}</p>
              {formErrorCode === "stock" ? (
                <Link
                  href="/cos"
                  className="font-semibold text-forest underline underline-offset-2"
                >
                  Mergi la coș
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <aside aria-labelledby="sumar-comanda" className="lg:sticky lg:top-28 lg:self-start">
        <div className="flex flex-col gap-5 rounded-xl border border-line bg-surface p-5 shadow-xs md:p-6">
          <h2 id="sumar-comanda" className="font-display text-2xl">
            Comanda ta
          </h2>
          <ul className="flex flex-col gap-4">
            {cart.lines.map((line) => (
              <li key={line.productId} className="flex items-center gap-3">
                <div className="relative w-14 shrink-0 overflow-hidden rounded-md">
                  <ProductImage
                    name={line.name}
                    productType={line.productType}
                    image={line.image}
                    tone={line.tone}
                    aspect="square"
                    sizes="56px"
                  />
                  <span className="absolute -top-0 -right-0 grid min-w-5 place-items-center rounded-bl-md bg-forest px-1 text-xs font-semibold text-ink-inverse">
                    {line.quantity}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-semibold">{line.name}</span>
                  <span className="text-xs text-ink-muted">
                    {line.quantity} × {formatMoney(line.unitPrice)}
                  </span>
                  {line.issue ? (
                    <span className="text-xs font-medium text-danger">
                      {line.issue === "quantity-reduced"
                        ? `Doar ${line.quantity} în stoc`
                        : "Indisponibil"}
                    </span>
                  ) : null}
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatMoney(line.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          <CouponForm
            coupon={cart.coupon}
            onUpdated={() => requote()}
            className="border-t border-line pt-4"
          />
          <div aria-live="polite" aria-busy={quoting}>
            <CartSummary cart={cart} />
          </div>
          {step === 4 ? (
            <Button
              size="lg"
              block
              onClick={submit}
              loading={submitting}
              disabled={quoting || cart.itemCount === 0}
              className="h-auto min-h-12 py-3 text-center whitespace-normal"
            >
              Plasează comanda cu obligație de plată
            </Button>
          ) : null}
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <Lock aria-hidden className="size-3.5" /> Prețurile și stocul sunt verificate din nou la
            trimitere.
          </p>
        </div>
      </aside>
    </div>
  );
}
