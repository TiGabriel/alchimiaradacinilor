import { formatMoney } from "../../money";

import { renderEmail, type EmailBlock, type EmailBrand, type RenderedEmail } from "./layout";

export type OrderEmailData = {
  number: string;
  firstName: string;
  url: string;
  items: Array<{ name: string; quantity: number; lineTotal: number }>;
  subtotal: number;
  discount: number;
  discountLabel: string | null;
  shipping: number;
  shippingMethodName: string;
  total: number;
  tax: number;
  currency: string;
  paymentLabel: string;
  paymentInstructions: string[];
  shippingAddress: string[];
};

function summaryBlocks(o: OrderEmailData): EmailBlock[] {
  const money = (v: number) => formatMoney(v, o.currency);
  return [
    {
      type: "rows",
      rows: o.items.map((i) => ({ label: `${i.quantity} × ${i.name}`, value: money(i.lineTotal) })),
    },
    { type: "divider" },
    {
      type: "rows",
      rows: [
        { label: "Subtotal", value: money(o.subtotal) },
        ...(o.discount > 0
          ? [{ label: o.discountLabel ?? "Reducere", value: `−${money(o.discount)}` }]
          : []),
        {
          label: `Livrare (${o.shippingMethodName})`,
          value: o.shipping > 0 ? money(o.shipping) : "Gratuită",
        },
        { label: "Total", value: money(o.total), strong: true },
      ],
    },
    { type: "note", text: `Prețurile includ TVA (${money(o.tax)}).` },
  ];
}

export function orderConfirmationEmail(o: OrderEmailData, brand: EmailBrand): RenderedEmail {
  return renderEmail(
    {
      subject: `Comanda ${o.number} a fost înregistrată · ${brand.siteName}`,
      preheader: `Mulțumim, ${o.firstName}! Iată rezumatul comenzii tale.`,
      heading: "Comanda ta a fost înregistrată.",
      blocks: [
        {
          type: "paragraph",
          text: `Mulțumim, ${o.firstName}! Am primit comanda ${o.number} și ne apucăm de pregătirea ei.`,
        },
        ...summaryBlocks(o),
        { type: "divider" },
        { type: "paragraph", text: `Plată: ${o.paymentLabel}` },
        ...(o.paymentInstructions.length
          ? [{ type: "list" as const, items: o.paymentInstructions }]
          : []),
        { type: "paragraph", text: "Livrare la:" },
        { type: "list", items: o.shippingAddress },
        { type: "button", label: "Vezi comanda", href: o.url },
      ],
      footer: `Ai primit acest email pentru că ai plasat o comandă pe ${brand.siteName}.`,
    },
    brand,
  );
}

export function orderStatusEmail(
  o: {
    number: string;
    firstName: string;
    url: string;
    statusLabel: string;
    message: string;
    note: string | null;
  },
  brand: EmailBrand,
): RenderedEmail {
  return renderEmail(
    {
      subject: `Comanda ${o.number}: ${o.statusLabel.toLowerCase()} · ${brand.siteName}`,
      preheader: o.message,
      heading: `Comanda ${o.number}: ${o.statusLabel.toLowerCase()}`,
      blocks: [
        { type: "paragraph", text: `Salut, ${o.firstName}! ${o.message}` },
        ...(o.note ? [{ type: "note" as const, text: o.note }] : []),
        { type: "button", label: "Vezi comanda", href: o.url },
      ],
      footer: `Ai primit acest email pentru că ai o comandă pe ${brand.siteName}.`,
    },
    brand,
  );
}
