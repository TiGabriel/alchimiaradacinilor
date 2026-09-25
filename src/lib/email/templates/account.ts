import { renderEmail, type EmailBrand, type RenderedEmail } from "./layout";

export function verificationEmail(
  p: { firstName: string; url: string; hours: number },
  brand: EmailBrand,
): RenderedEmail {
  return renderEmail(
    {
      subject: `Confirmă adresa de email · ${brand.siteName}`,
      preheader: "Un singur pas până la contul tău.",
      heading: `Bine ai venit, ${p.firstName}!`,
      blocks: [
        {
          type: "paragraph",
          text: "Mai avem un singur pas: confirmă că aceasta este adresa ta de email.",
        },
        { type: "button", label: "Confirmă adresa de email", href: p.url },
        {
          type: "note",
          text: `Linkul este valabil ${p.hours} ore. Dacă butonul nu funcționează, copiază adresa de mai jos în browser:`,
        },
        { type: "code", text: p.url },
      ],
      footer: `Ai primit acest email pentru că cineva a creat un cont ${brand.siteName} cu această adresă. Dacă nu ai fost tu, ignoră mesajul — contul nu va fi activat.`,
    },
    brand,
  );
}

export function welcomeEmail(
  p: { firstName: string; shopUrl: string; quizUrl: string },
  brand: EmailBrand,
): RenderedEmail {
  return renderEmail(
    {
      subject: `Contul tău este gata · ${brand.siteName}`,
      preheader: "Adresa ta a fost confirmată. Iată de unde poți începe.",
      heading: `Mulțumim, ${p.firstName}!`,
      blocks: [
        {
          type: "paragraph",
          text: "Adresa ta de email a fost confirmată, iar contul tău este gata.",
        },
        {
          type: "list",
          items: [
            "Salvează produsele preferate și regăsește-le oricând.",
            "Fă quiz-ul aromatic pentru recomandări potrivite ție.",
            "Urmărește comenzile și adresele dintr-un singur loc.",
          ],
        },
        { type: "button", label: "Descoperă produsele", href: p.shopUrl },
        { type: "note", text: `Nu știi de unde să începi? Quiz-ul durează un minut: ${p.quizUrl}` },
      ],
    },
    brand,
  );
}

export function passwordResetEmail(
  p: { firstName: string; url: string; minutes: number },
  brand: EmailBrand,
): RenderedEmail {
  return renderEmail(
    {
      subject: `Resetează parola · ${brand.siteName}`,
      preheader: "Ai cerut o parolă nouă pentru contul tău.",
      heading: "Resetează parola",
      blocks: [
        {
          type: "paragraph",
          text: `Salut, ${p.firstName}! Am primit o cerere de resetare a parolei pentru contul tău.`,
        },
        { type: "button", label: "Alege o parolă nouă", href: p.url },
        {
          type: "note",
          text: `Linkul este valabil ${p.minutes} de minute și poate fi folosit o singură dată.`,
        },
        { type: "code", text: p.url },
      ],
      footer:
        "Dacă nu ai cerut resetarea parolei, ignoră acest email — parola ta rămâne neschimbată.",
    },
    brand,
  );
}

export function contactMessageEmail(
  p: { name: string; email: string; subject: string | null; message: string },
  brand: EmailBrand,
): RenderedEmail {
  return renderEmail(
    {
      subject: `Mesaj nou din formularul de contact${p.subject ? `: ${p.subject}` : ""}`,
      preheader: `De la ${p.name}`,
      heading: "Mesaj nou de pe site",
      blocks: [
        {
          type: "list",
          items: [
            `Nume: ${p.name}`,
            `Email: ${p.email}`,
            ...(p.subject ? [`Subiect: ${p.subject}`] : []),
          ],
        },
        { type: "divider" },
        ...p.message.split(/\n{2,}/).map((text) => ({ type: "paragraph" as const, text })),
      ],
      footer:
        "Trimis din formularul de contact. Răspunde direct la acest email pentru a-i scrie expeditorului.",
    },
    brand,
  );
}
