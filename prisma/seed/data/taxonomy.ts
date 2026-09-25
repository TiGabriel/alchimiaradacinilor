/**
 * Structural taxonomy. These are real site categories (not demo data), except
 * for the sample subcategories, which exist to exercise the category tree and
 * can be renamed or removed freely.
 */

export const categories = [
  {
    slug: "uleiuri-individuale",
    name: "Uleiuri individuale",
    description:
      "Uleiuri esențiale dintr-o singură plantă, pentru a descoperi fiecare aromă în parte.",
    children: [
      {
        slug: "uleiuri-citrice",
        name: "Citrice",
        description: "Arome luminoase, obținute din coji de citrice.",
      },
      {
        slug: "uleiuri-din-frunze-si-ierburi",
        name: "Frunze și ierburi",
        description: "Arome verzi, proaspete.",
      },
      { slug: "uleiuri-din-flori", name: "Flori", description: "Arome florale, delicate." },
    ],
  },
  {
    slug: "amestecuri",
    name: "Amestecuri",
    description: "Combinații gândite pentru momente anume ale zilei.",
    children: [],
  },
  {
    slug: "kituri",
    name: "Kit-uri",
    description: "Seturi care adună mai multe produse într-un singur ritual.",
    children: [],
  },
  {
    slug: "difuzoare",
    name: "Difuzoare",
    description: "Pentru a răspândi aroma în încăperea ta.",
    children: [],
  },
  {
    slug: "accesorii",
    name: "Accesorii",
    description: "Flacoane, recipiente și tot ce te ajută să-ți organizezi uleiurile.",
    children: [
      {
        slug: "flacoane-si-roll-on",
        name: "Flacoane și roll-on",
        description: "Recipiente pentru amestecuri proprii.",
      },
      { slug: "calatorie", name: "Călătorie", description: "Pentru a-ți lua ritualurile cu tine." },
    ],
  },
  {
    slug: "ingrijire",
    name: "Îngrijire",
    description: "Produse de îngrijire care completează rutina aromatică.",
    children: [],
  },
] as const;

export const needs = [
  {
    slug: "relaxare",
    name: "Relaxare",
    description: "Pentru momentele în care vrei să încetinești ritmul.",
  },
  { slug: "seara", name: "Seară", description: "Ritualuri pentru finalul zilei." },
  { slug: "concentrare", name: "Concentrare", description: "Pentru orele de lucru și studiu." },
  { slug: "energie", name: "Energie", description: "Arome vii pentru începutul zilei." },
  { slug: "casa", name: "Casă", description: "Pentru o atmosferă plăcută acasă." },
  {
    slug: "ingrijire-personala",
    name: "Îngrijire personală",
    description: "Pentru rutina ta de îngrijire.",
  },
  {
    slug: "incepator",
    name: "Începător",
    description: "Primii pași în lumea uleiurilor esențiale.",
  },
  { slug: "prospetime", name: "Prospețime", description: "Arome curate și răcoritoare." },
] as const;

export const aromaProfiles = [
  {
    slug: "citric",
    name: "Citric",
    colorHex: "#E3B23C",
    description: "Luminos, vioi, ca o coajă proaspătă de citrice.",
  },
  {
    slug: "floral",
    name: "Floral",
    colorHex: "#B98BB3",
    description: "Delicat și rotund, ca o grădină în floare.",
  },
  { slug: "mentolat", name: "Mentolat", colorHex: "#6FB3A0", description: "Răcoros și clar." },
  {
    slug: "lemnos",
    name: "Lemnos",
    colorHex: "#8A6A4F",
    description: "Cald și așezat, ca lemnul de pădure.",
  },
  {
    slug: "pamantiu",
    name: "Pământiu",
    colorHex: "#6E5B45",
    description: "Profund, cu note de rădăcină și sol.",
  },
  {
    slug: "proaspat",
    name: "Proaspăt",
    colorHex: "#8FB58A",
    description: "Curat, verde, aerisit.",
  },
  { slug: "dulce", name: "Dulce", colorHex: "#D98E5F", description: "Moale și învăluitor." },
  {
    slug: "condimentat",
    name: "Condimentat",
    colorHex: "#B5553C",
    description: "Cald, cu o notă de condimente.",
  },
] as const;

export const tags = [
  { slug: "nou", name: "Nou" },
  { slug: "popular", name: "Popular" },
  { slug: "idee-de-cadou", name: "Idee de cadou" },
  { slug: "pentru-difuzor", name: "Pentru difuzor" },
  { slug: "format-de-calatorie", name: "Format de călătorie" },
  { slug: "editie-limitata", name: "Ediție limitată" },
] as const;

export const roles = [
  { key: "customer", name: "Client", description: "Cont de client." },
  { key: "editor", name: "Editor", description: "Poate edita conținut și catalog." },
  { key: "admin", name: "Administrator", description: "Acces complet." },
] as const;

/** Fictional brands used only for demo products. */
export const demoBrands = [
  {
    slug: "botanica-demo",
    name: "Botanica Demo",
    description: "Brand fictiv folosit pentru produsele demonstrative.",
  },
  {
    slug: "atelierul-demo",
    name: "Atelierul Demo",
    description: "Brand fictiv pentru accesorii demonstrative.",
  },
] as const;
