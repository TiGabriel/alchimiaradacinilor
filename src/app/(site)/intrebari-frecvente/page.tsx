import type { Metadata } from "next";
import Link from "next/link";

import { Sprig } from "@/components/botanical";
import { Reveal } from "@/components/motion";
import { JsonLd } from "@/components/seo/json-ld";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { availablePaymentOptions } from "@/services/payments/methods";
import { pageMetadata } from "@/services/seo";
import { getSettings } from "@/services/settings";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Întrebări frecvente",
    description:
      "Comenzi, livrare, plată, retur și cum alegi primele uleiuri esențiale — răspunsuri scurte.",
    path: "/intrebari-frecvente",
  });
}

type Faq = { q: string; a: React.ReactNode; text: string };

const link = "text-forest underline underline-offset-2 hover:text-forest-deep";

export default async function FaqPage() {
  const { shipping, payment } = await getSettings();
  const methods = shipping.methods.filter((m) => m.active);
  const payments = availablePaymentOptions(payment);
  const shippingText = methods
    .map((m) => `${m.name}: ${m.price > 0 ? formatMoney(m.price) : "gratuit"}`)
    .join("; ");
  const freeText =
    shipping.freeShippingThreshold != null
      ? ` Comenzile de peste ${formatMoney(shipping.freeShippingThreshold)} (după reduceri) au livrare gratuită.`
      : "";

  // Answers are built from the site settings, so prices and methods stay accurate.
  const groups: Array<{ title: string; items: Faq[] }> = [
    {
      title: "Primii pași",
      items: [
        {
          q: "Nu știu nimic despre uleiuri esențiale. De unde încep?",
          text: "Răspunde la quiz-ul aromatic sau alege un moment al zilei; îți arătăm câteva arome potrivite și de ce.",
          a: (
            <p>
              Cel mai simplu: răspunde la{" "}
              <Link href="/quiz" className={link}>
                quiz-ul aromatic
              </Link>{" "}
              (cam două minute) sau alege un moment al zilei în{" "}
              <Link href="/descopera/nevoi" className={link}>
                Descoperă după nevoie
              </Link>
              . Pentru fiecare recomandare îți spunem și de ce a fost aleasă. Dacă preferi să începi
              cu puține sticluțe, uită-te la kit-urile de început.
            </p>
          ),
        },
        {
          q: "Cum folosesc un ulei esențial?",
          text: "Cel mai des în difuzor, câteva picături în apă. Pentru aplicarea pe piele se diluează într-un ulei purtător; citește instrucțiunile de pe fiecare produs.",
          a: (
            <p>
              Cel mai des, în difuzor: câteva picături în apa rezervorului. Pentru aplicarea pe
              piele, uleiurile esențiale se diluează într-un ulei purtător. Fiecare produs are o
              secțiune „Utilizare” și una „Siguranță” — citește-le înainte de prima folosire și
              păstrează sticluțele departe de copii și animale.{" "}
              <Link href="/rutine" className={link}>
                Rutinele
              </Link>{" "}
              arată pas cu pas câteva ritualuri simple.
            </p>
          ),
        },
        {
          q: "Uleiurile esențiale tratează sau vindecă afecțiuni?",
          text: "Nu facem astfel de afirmații. Descriem aroma și momentele în care o poți folosi. Pentru orice problemă de sănătate, discută cu medicul.",
          a: (
            <p>
              Nu facem astfel de afirmații. Descriem aroma, atmosfera și momentele zilei în care se
              potrivește fiecare produs. Pentru orice întrebare legată de sănătate, sarcină sau
              alăptare, vorbește cu medicul tău.
            </p>
          ),
        },
      ],
    },
    {
      title: "Comenzi și livrare",
      items: [
        {
          q: "Cât costă livrarea?",
          text: `${shippingText}.${freeText}`,
          a: (
            <>
              <ul className="list-disc pl-5">
                {methods.map((m) => (
                  <li key={m.code}>
                    {m.name}: {m.price > 0 ? formatMoney(m.price) : "gratuit"}
                    {m.description ? ` — ${m.description}` : ""}
                  </li>
                ))}
              </ul>
              {freeText ? <p className="mt-2">{freeText.trim()}</p> : null}
              <p className="mt-2">
                Detalii în{" "}
                <Link href="/livrare-si-retur" className={link}>
                  Livrare și retur
                </Link>
                .
              </p>
            </>
          ),
        },
        {
          q: "Am nevoie de cont ca să comand?",
          text: "Da, comanda se plasează dintr-un cont cu adresa de email confirmată. Coșul se păstrează și îl regăsești după autentificare.",
          a: (
            <p>
              Da — comanda se plasează dintr-un cont cu adresa de email confirmată, ca să-ți putem
              trimite confirmarea și să vezi oricând istoricul comenzilor. Ce ai pus în coș înainte
              de autentificare rămâne acolo.{" "}
              <Link href="/cont/inregistrare" className={link}>
                Creează un cont
              </Link>{" "}
              în mai puțin de un minut.
            </p>
          ),
        },
        {
          q: "Unde văd stadiul comenzii?",
          text: "În contul tău, la Comenzi, cu toate schimbările de stare.",
          a: (
            <p>
              În{" "}
              <Link href="/cont/comenzi" className={link}>
                contul tău, la Comenzi
              </Link>
              : vezi produsele, adresa, totalul și fiecare schimbare de stare.
            </p>
          ),
        },
      ],
    },
    {
      title: "Plată și retur",
      items: [
        {
          q: "Cum pot plăti?",
          text: payments.length
            ? `${payments.map((p) => p.label).join(", ")}. Plata cu cardul nu este disponibilă momentan.`
            : "Metodele de plată sunt afișate la finalizarea comenzii.",
          a: (
            <>
              <ul className="list-disc pl-5">
                {payments.map((p) => (
                  <li key={p.method}>
                    {p.label}
                    {p.description ? ` — ${p.description}` : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-2">Plata cu cardul nu este disponibilă momentan.</p>
            </>
          ),
        },
        {
          q: "Pot returna un produs?",
          text: "Da, ai la dispoziție 14 zile de la primire pentru a te retrage din contract, în condițiile din Politica de retur.",
          a: (
            <p>
              Da. Ai 14 zile de la primirea coletului ca să te retragi din contract, în condițiile
              descrise în{" "}
              <Link href="/politica-de-retur" className={link}>
                Politica de retur
              </Link>
              .
            </p>
          ),
        },
        {
          q: "Prețurile includ TVA?",
          text: "Da, toate prețurile afișate includ TVA.",
          a: <p>Da, toate prețurile afișate includ TVA; valoarea TVA apare pe fiecare comandă.</p>,
        },
      ],
    },
    {
      title: "Cont și date personale",
      items: [
        {
          q: "Ce fac cu recomandările personalizate?",
          text: "Sunt opționale. Le poți activa sau dezactiva din cont, iar datele tale nu sunt vândute.",
          a: (
            <p>
              Sunt opționale: dacă ești de acord, folosim ce ai salvat și ce ai privit pentru
              sugestii mai potrivite. Poți schimba oricând alegerea din{" "}
              <Link href="/cont/recomandari" className={link}>
                cont
              </Link>{" "}
              și din setările de cookie-uri. Mai multe în{" "}
              <Link href="/politica-de-confidentialitate" className={link}>
                Politica de confidențialitate
              </Link>
              .
            </p>
          ),
        },
        {
          q: "Cum mă dezabonez de la newsletter?",
          text: "Din linkul aflat la finalul fiecărui email sau din contul tău, la Newsletter.",
          a: (
            <p>
              Din linkul de la finalul fiecărui email, cu un singur clic, sau din{" "}
              <Link href="/cont/newsletter" className={link}>
                contul tău
              </Link>
              .
            </p>
          ),
        },
      ],
    },
  ];

  return (
    <div className="container-page flex max-w-3xl flex-col gap-12 pt-10 pb-(--spacing-section) md:pt-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: groups.flatMap((g) =>
            g.items.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.text },
            })),
          ),
        }}
      />
      <Reveal className="relative flex flex-col gap-4">
        <Sprig aria-hidden className="absolute -top-4 right-0 hidden h-28 text-sage/60 md:block" />
        <p className="text-eyebrow text-clay">Ajutor</p>
        <h1 className="text-display-xl">Întrebări frecvente</h1>
        <p className="text-lg text-ink-muted">
          Răspunsuri scurte despre comenzi, livrare și primii pași cu uleiurile esențiale.
        </p>
      </Reveal>

      {groups.map((group) => (
        <section key={group.title} aria-labelledby={`faq-${group.title}`}>
          <h2 id={`faq-${group.title}`} className="text-2xl">
            {group.title}
          </h2>
          <Accordion type="multiple" className="mt-2">
            {group.items.map((f) => (
              <AccordionItem key={f.q} value={f.q}>
                <AccordionTrigger>{f.q}</AccordionTrigger>
                <AccordionContent className="leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      ))}

      <section className="flex flex-col items-start gap-4 rounded-2xl bg-paper-deep p-6 md:p-8">
        <h2 className="text-2xl">N-ai găsit răspunsul?</h2>
        <p className="text-ink-muted">Scrie-ne și îți răspundem în zilele lucrătoare.</p>
        <Button asChild variant="outline">
          <Link href="/contact">Scrie-ne</Link>
        </Button>
      </section>
    </div>
  );
}
