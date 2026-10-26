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
import { pageMetadata } from "@/services/seo";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: "Întrebări frecvente",
    description:
      "Cum cumperi produsele de pe doTERRA și cum alegi primele uleiuri esențiale — răspunsuri scurte.",
    path: "/intrebari-frecvente",
  });
}

type Faq = { q: string; a: React.ReactNode; text: string };

const link = "text-forest underline underline-offset-2 hover:text-forest-deep";

export default function FaqPage() {
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
              <Link href="/ritualuri" className={link}>
                Ritualurile
              </Link>{" "}
              noastre arată pas cu pas cum le folosim.
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
      title: "Cum cumpăr",
      items: [
        {
          q: "Pot cumpăra produse de pe acest site?",
          text: "Nu. Nu vindem produse: le descriem aici, iar tu le cumperi direct de pe site-ul oficial doTERRA.",
          a: (
            <p>
              Nu. Nu vindem produse: le descriem aici, iar tu le cumperi direct de pe site-ul
              oficial doTERRA. Vezi{" "}
              <Link href="/cum-cumpar" className={link}>
                Cum cumpăr
              </Link>
              .
            </p>
          ),
        },
        {
          q: "Ce preț au produsele?",
          text: "Prețul afișat la fiecare produs este cel de pe site-ul doTERRA. Comanda, plata, livrarea și retururile se fac pe site-ul doTERRA.",
          a: (
            <p>
              Prețul afișat la fiecare produs este cel de pe site-ul doTERRA. Comanda, plata,
              livrarea și eventualele retururi se fac pe site-ul doTERRA, după condițiile lor.
            </p>
          ),
        },
        {
          q: "Plătesc mai mult dacă folosesc linkurile voastre?",
          text: "Nu. Butoanele „Cumpără de pe doTERRA” sunt linkuri de recomandare: noi primim o recompensă de la doTERRA, iar prețul pentru tine rămâne același.",
          a: (
            <p>
              Nu. Butoanele „Cumpără de pe doTERRA” sunt linkuri de recomandare: dacă un produs este
              cumpărat prin ele, primim o recompensă de la doTERRA, iar prețul pentru tine rămâne
              același. Detalii în{" "}
              <Link href="/transparenta-afiliere" className={link}>
                Transparență afiliere
              </Link>
              .
            </p>
          ),
        },
        {
          q: "Ce înseamnă „Link în curând”?",
          text: "Încă nu am adăugat linkul către acel produs pe site-ul doTERRA. Până atunci îl găsești căutându-l direct pe site-ul doTERRA.",
          a: (
            <p>
              Încă nu am adăugat linkul către acel produs pe site-ul doTERRA. Până atunci îl găsești
              căutându-l direct pe site-ul doTERRA, după nume.
            </p>
          ),
        },
        {
          q: "La ce îmi folosește un cont?",
          text: "Cu un cont îți salvezi produsele, ritualurile și rezultatele quiz-ului și poți scrie recenzii.",
          a: (
            <p>
              Cu un cont îți salvezi produsele, ritualurile și rezultatele quiz-ului și poți scrie
              recenzii.{" "}
              <Link href="/cont/inregistrare" className={link}>
                Creează un cont
              </Link>{" "}
              în mai puțin de un minut.
            </p>
          ),
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
          Răspunsuri scurte despre cum cumperi și primii pași cu uleiurile esențiale.
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
