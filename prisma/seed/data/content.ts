/**
 * DEMO editorial content: routines and journal articles.
 *
 * Original copy, marked as demo. It describes moments, aromas and simple
 * habits — never health effects. Quantities are always deferred to the
 * product label ("cantitatea recomandată pe etichetă"), never invented.
 *
 * Articles can embed cards with a line of its own: {{produs:slug}} or {{rutina:slug}}.
 */
import type { RoutineDifficulty, RoutineTimeOfDay } from "../../../src/generated/prisma/enums";

export type SeedRoutine = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  timeOfDay: RoutineTimeOfDay;
  difficulty: RoutineDifficulty;
  durationMinutes: number;
  frequency: string;
  featured?: boolean;
  needs: string[];
  tags: string[];
  products: Array<{ slug: string; optional?: boolean; note?: string }>;
  steps: Array<{ title: string; instructions: string; minutes?: number; product?: string }>;
};

const labelNote =
  "Folosește cantitatea recomandată pe eticheta produsului și urmează instrucțiunile producătorului.";

export const routines: SeedRoutine[] = [
  {
    slug: "ritual-de-seara",
    title: "Ritual de seară",
    summary:
      "Un sfârșit de zi mai lent: lumină caldă, o aromă florală și câteva minute doar pentru tine.",
    description:
      "Seara e momentul în care casa se liniștește. Ritualul acesta nu cere nimic complicat: un difuzor, o aromă florală și obiceiul de a pune deoparte telefonul pentru câteva minute.\n\n_Rutină demonstrativă._",
    timeOfDay: "EVENING",
    difficulty: "BEGINNER",
    durationMinutes: 15,
    frequency: "Zilnic, cu o oră înainte de culcare",
    featured: true,
    needs: ["seara", "relaxare", "incepator"],
    tags: ["pentru-difuzor"],
    products: [
      { slug: "lavender" },
      { slug: "amestec-liniste-de-seara" },
      {
        slug: "difuzor-ceramic-piatra",
        note: "Orice difuzor pe care îl ai deja funcționează la fel de bine.",
      },
    ],
    steps: [
      {
        title: "Pregătește încăperea",
        instructions:
          "Stinge lumina puternică și lasă doar o veioză. Aerisește camera câteva minute.",
        minutes: 3,
      },
      {
        title: "Pornește difuzorul",
        instructions: `Umple rezervorul cu apă și adaugă amestecul de seară. ${labelNote}`,
        minutes: 2,
        product: "amestec-liniste-de-seara",
      },
      {
        title: "Un moment fără ecrane",
        instructions: "Citește câteva pagini sau notează trei lucruri bune din ziua ta.",
        minutes: 10,
      },
      {
        title: "Încheie ritualul",
        instructions: "Oprește difuzorul înainte de culcare și aerisește scurt camera.",
        product: "difuzor-ceramic-piatra",
      },
    ],
  },
  {
    slug: "rutina-de-dimineata",
    title: "Rutina de dimineață",
    summary:
      "Citrice luminoase și o fereastră deschisă — un început de zi limpede, în cinci minute.",
    description:
      "Diminețile nu trebuie să fie grăbite. Câteva minute de aer proaspăt și o aromă citrică pot face din pregătirea zilei un mic ritual.\n\n_Rutină demonstrativă._",
    timeOfDay: "MORNING",
    difficulty: "BEGINNER",
    durationMinutes: 5,
    frequency: "În zilele lucrătoare, dimineața",
    featured: true,
    needs: ["energie", "prospetime"],
    tags: ["pentru-difuzor"],
    products: [
      { slug: "wild-orange" },
      { slug: "lemon" },
      { slug: "amestec-dimineata-senina", optional: true },
    ],
    steps: [
      {
        title: "Deschide fereastra",
        instructions: "Lasă aerul proaspăt să intre cât îți pregătești cafeaua sau ceaiul.",
        minutes: 2,
      },
      {
        title: "O aromă citrică",
        instructions: `Pornește difuzorul cu portocală sau lămâie. ${labelNote}`,
        minutes: 1,
        product: "wild-orange",
      },
      {
        title: "Planul zilei",
        instructions: "Scrie cele trei lucruri importante pentru azi, în liniște.",
        minutes: 2,
      },
    ],
  },
  {
    slug: "moment-de-concentrare",
    title: "Moment de concentrare",
    summary:
      "Un birou aerisit, o aromă mentolată discretă și reguli simple pentru o oră de lucru adâncit.",
    description:
      "Concentrarea ține mai mult de obiceiuri decât de noroc. Rutina aceasta leagă o aromă de începutul unui interval de lucru fără întreruperi.\n\n_Rutină demonstrativă._",
    timeOfDay: "DAY",
    difficulty: "BEGINNER",
    durationMinutes: 60,
    frequency: "Când începi o sesiune de lucru sau studiu",
    needs: ["concentrare", "prospetime"],
    tags: [],
    products: [{ slug: "peppermint" }, { slug: "lemon", optional: true }],
    steps: [
      {
        title: "Fă loc pe birou",
        instructions: "Păstrează pe masă doar ce îți trebuie pentru sarcina de acum.",
        minutes: 3,
      },
      {
        title: "Semnalul de start",
        instructions: `Pornește difuzorul cu mentă, la o distanță confortabilă de birou. ${labelNote}`,
        product: "peppermint",
      },
      {
        title: "O oră fără notificări",
        instructions: "Pune telefonul pe silențios și lucrează la un singur lucru.",
        minutes: 50,
      },
      {
        title: "Pauza",
        instructions: "Oprește difuzorul, ridică-te și aerisește camera câteva minute.",
        minutes: 7,
      },
    ],
  },
  {
    slug: "atmosfera-pentru-casa",
    title: "Atmosferă pentru casă",
    summary:
      "Casa ta, primitoare: arome curate pentru zilele de curățenie și pentru serile cu prieteni.",
    description:
      "O casă care miroase a proaspăt începe cu aer curat. Aromele vin la final, ca un gest de bun venit.\n\n_Rutină demonstrativă._",
    timeOfDay: "ANYTIME",
    difficulty: "BEGINNER",
    durationMinutes: 20,
    frequency: "De câteva ori pe săptămână",
    needs: ["casa", "prospetime"],
    tags: ["pentru-difuzor", "idee-de-cadou"],
    products: [
      { slug: "amestec-casa-proaspata" },
      { slug: "wild-orange" },
      { slug: "difuzor-lemn-de-nuc", optional: true },
      { slug: "tea-tree", optional: true },
    ],
    steps: [
      {
        title: "Aerisește",
        instructions: "Deschide ferestrele din toată casa timp de zece minute.",
        minutes: 10,
      },
      {
        title: "Alege aroma",
        instructions: `Pentru o atmosferă curată, amestecul pentru casă; pentru o seară cu prieteni, portocala. ${labelNote}`,
        product: "amestec-casa-proaspata",
      },
      {
        title: "Un singur difuzor",
        instructions:
          "Pune difuzorul în încăperea în care stați cel mai mult, nu în fiecare cameră.",
        minutes: 5,
      },
    ],
  },
];

export const articleCategories = [
  {
    slug: "ghiduri",
    name: "Ghiduri",
    description: "Pas cu pas, pentru cine vrea să înțeleagă înainte de a alege.",
  },
  {
    slug: "uleiuri",
    name: "Uleiuri",
    description: "Portrete de arome: de unde vin și cum le poți folosi în rutina ta.",
  },
  {
    slug: "rutine",
    name: "Rutine",
    description: "Idei de ritualuri simple pentru fiecare moment al zilei.",
  },
  {
    slug: "aromaterapie",
    name: "Aromaterapie",
    description: "Despre arome, tradiții și obiceiuri, spuse simplu.",
  },
  { slug: "casa", name: "Casă", description: "Atmosferă, curățenie și ospitalitate." },
  {
    slug: "ingrijire",
    name: "Îngrijire",
    description: "Obiceiuri de îngrijire în care aromele au un loc.",
  },
  { slug: "incepatori", name: "Începători", description: "Primii pași, fără termeni complicați." },
] as const;

export type SeedArticle = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  daysAgo: number;
  featured?: boolean;
  tags: string[];
  products: string[];
  routines: string[];
  content: string;
};

const demo = "\n\n_Articol demonstrativ, scris pentru prezentarea site-ului._";

export const articles: SeedArticle[] = [
  {
    slug: "primii-pasi-cu-uleiurile-esentiale",
    title: "Primii pași cu uleiurile esențiale",
    excerpt:
      "Nu ai nevoie de zeci de sticluțe. Câteva arome bine alese și obiceiul de a le folosi sunt un început excelent.",
    category: "incepatori",
    daysAgo: 4,
    featured: true,
    tags: ["popular"],
    products: ["kit-primii-pasi", "lavender", "lemon"],
    routines: ["ritual-de-seara", "rutina-de-dimineata"],
    content: `Când descoperi uleiurile esențiale, e tentant să vrei totul deodată. Recomandarea noastră e opusă: **începe cu puțin** și învață să folosești bine ce ai.

## Alege după momente, nu după liste

Gândește-te la momentele în care ți-ar plăcea o aromă: dimineața, la birou, seara. Pentru fiecare, o singură aromă e suficientă la început.

{{produs:kit-primii-pasi}}

## Citește eticheta

Fiecare produs are instrucțiunile lui de utilizare și de siguranță. Cantitatea potrivită și modul de folosire sunt cele indicate de producător — nu cele din auzite.

## Leagă aroma de un obicei

O aromă folosită în același moment al zilei devine un semnal: „acum încep lucrul” sau „acum se termină ziua”.

{{rutina:ritual-de-seara}}

## Notează ce îți place

Un carnețel simplu te ajută să vezi, după câteva săptămâni, ce arome folosești cu adevărat.${demo}`,
  },
  {
    slug: "lavanda-o-aroma-pentru-serile-linistite",
    title: "Lavanda, o aromă pentru serile liniștite",
    excerpt:
      "Floral, rotund, familiar — de ce lavanda e aroma cu care mulți își încep ritualul de seară.",
    category: "uleiuri",
    daysAgo: 11,
    tags: ["popular"],
    products: ["lavender", "amestec-liniste-de-seara"],
    routines: ["ritual-de-seara"],
    content: `Puține arome sunt atât de ușor de recunoscut ca lavanda. Pentru mulți, mirosul ei e legat de sertarele bunicilor sau de câmpurile mov din vacanțe.

## Un profil floral, rotund

Lavanda are o notă florală moale, cu o ușoară dulceață. Se potrivește bine cu aromele lemnoase și cu citricele dulci.

{{produs:lavender}}

## În ritualul de seară

Pentru că e o aromă calmă și familiară, lavanda e des aleasă pentru finalul zilei: difuzată în dormitor cu puțin înainte de culcare, într-o cameră aerisită.

{{rutina:ritual-de-seara}}

## Cum o combini

Dacă vrei ceva mai cald, încearcă un amestec cu note lemnoase. Dacă vrei ceva mai luminos, o notă de portocală.${demo}`,
  },
  {
    slug: "cum-iti-alegi-difuzorul",
    title: "Cum îți alegi difuzorul",
    excerpt:
      "Mărimea camerei, zgomotul, lumina și cât de ușor se curăță — întrebările care contează.",
    category: "ghiduri",
    daysAgo: 18,
    tags: ["pentru-difuzor"],
    products: ["difuzor-ceramic-piatra", "difuzor-lemn-de-nuc"],
    routines: ["atmosfera-pentru-casa"],
    content: `Un difuzor bun e cel pe care îl folosești cu plăcere. Înainte de a alege, răspunde la câteva întrebări.

## Unde îl vei folosi?

Un dormitor are nevoie de un difuzor silențios. Un living mare poate avea nevoie de un rezervor mai mare. Verifică specificațiile producătorului pentru suprafața recomandată.

## Cât de ușor se curăță?

Difuzoarele se curăță regulat, după instrucțiunile producătorului. Un rezervor accesibil face asta mult mai simplu.

{{produs:difuzor-ceramic-piatra}}

## Contează și cum arată

Difuzorul stă la vedere. Alege unul care se potrivește cu casa ta — ceramică, lemn sau un design minimalist.${demo}`,
  },
  {
    slug: "citricele-de-dimineata",
    title: "Citricele de dimineață",
    excerpt:
      "Lămâie, portocală și o fereastră deschisă: cum arată o dimineață luminoasă, în cinci minute.",
    category: "rutine",
    daysAgo: 25,
    tags: [],
    products: ["lemon", "wild-orange", "amestec-dimineata-senina"],
    routines: ["rutina-de-dimineata"],
    content: `Aromele citrice sunt vii și luminoase — de aceea multora le plac dimineața.

## Lămâie sau portocală?

Lămâia e mai vie și mai „curată”; portocala e mai dulce și mai caldă. Ambele merg bine cu o cafea și cu o fereastră deschisă.

{{produs:wild-orange}}

## O rutină scurtă

{{rutina:rutina-de-dimineata}}

## Un sfat despre citrice

Citește întotdeauna secțiunea de siguranță a produsului: unele uleiuri citrice au recomandări speciale legate de expunerea la soare.${demo}`,
  },
  {
    slug: "cum-citesti-eticheta-unui-ulei-esential",
    title: "Cum citești eticheta unui ulei esențial",
    excerpt:
      "Denumirea botanică, modul de utilizare, avertismentele: ce găsești pe etichetă și de ce contează.",
    category: "ghiduri",
    daysAgo: 32,
    tags: [],
    products: ["tea-tree", "peppermint"],
    routines: [],
    content: `Eticheta este cea mai importantă sursă de informații despre un ulei esențial. Merită citită de fiecare dată.

## Denumirea botanică

Numele latin al plantei te ajută să știi exact ce ai în sticluță — denumirile populare pot fi înșelătoare.

## Modul de utilizare

Producătorul indică dacă produsul este destinat difuzării sau altor utilizări și în ce cantități. Respectă aceste indicații.

## Avertismentele

Fii atent la recomandările pentru copii, pentru animalele de companie și la cele legate de expunerea la soare. Păstrează produsele la îndemâna adulților, departe de copii.

{{produs:tea-tree}}

## Când ai întrebări

Dacă ai nelămuriri legate de sănătate, discută cu un specialist. Noi îți putem spune cum arată și cum se folosesc produsele — nu putem oferi sfaturi medicale.${demo}`,
  },
];
