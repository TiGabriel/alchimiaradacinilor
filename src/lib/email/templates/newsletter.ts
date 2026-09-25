import { renderEmail, type EmailBlock, type EmailBrand, type RenderedEmail } from "./layout";

export function newsletterConfirmEmail(
  p: { url: string; hours: number },
  brand: EmailBrand,
): RenderedEmail {
  return renderEmail(
    {
      subject: `Confirmă abonarea la newsletter · ${brand.siteName}`,
      preheader: "Un clic și primești scrisorile noastre botanice.",
      heading: "Confirmă abonarea",
      blocks: [
        {
          type: "paragraph",
          text: "Mulțumim pentru interes! Confirmă că vrei să primești newsletterul nostru: ritualuri de sezon, povești despre plante și noutăți, cam o dată pe lună.",
        },
        { type: "button", label: "Confirmă abonarea", href: p.url },
        {
          type: "note",
          text: `Linkul este valabil ${p.hours} de ore. Dacă nu tu ai cerut abonarea, ignoră acest email — nu te vom abona fără confirmare.`,
        },
      ],
      footer: `Ai primit acest email pentru că adresa ta a fost introdusă în formularul de abonare ${brand.siteName}.`,
    },
    brand,
  );
}

/** Campaign body: plain paragraphs separated by blank lines (escaped by the layout). */
export function campaignEmail(
  p: {
    subject: string;
    preheader?: string | null;
    heading: string;
    body: string;
    unsubscribeUrl: string;
  },
  brand: EmailBrand,
): RenderedEmail {
  const paragraphs: EmailBlock[] = p.body
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((text) => ({ type: "paragraph", text }));
  return renderEmail(
    {
      subject: p.subject,
      preheader: p.preheader ?? p.heading,
      heading: p.heading,
      blocks: [
        ...paragraphs,
        { type: "divider" },
        {
          type: "note",
          text: `Nu mai vrei să primești aceste emailuri? Dezabonează-te cu un clic: ${p.unsubscribeUrl}`,
        },
      ],
      footer: `Primești acest newsletter pentru că te-ai abonat la ${brand.siteName} și ți-ai confirmat adresa.`,
    },
    brand,
  );
}
