/**
 * DEMO PRODUCTS — placeholders only.
 *
 * Names, prices and stock are invented for development. No official
 * specifications (volumes, compositions, certifications, usage claims) are
 * given: those must come from the producer's official documentation before
 * launch. Copy avoids any medical or therapeutic claim.
 */

import type { ProductType } from "../../../src/generated/prisma/enums";

export type DemoProduct = {
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  productType: ProductType;
  shortDescription: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  featured?: boolean;
  tags?: string[];
  needs?: Array<[slug: string, relevance: number]>;
  aromas?: Array<[slug: string, intensity: number]>;
  related?: string[];
  kitItems?: Array<[slug: string, quantity: number]>;
  daysAgo: number;
};

const demoNote =
  "\n\n_Produs demonstrativ. Descrierea oficială, compoziția și specificațiile vor fi preluate din documentația producătorului înainte de lansare._";

const usagePlaceholder =
  "Recomandările de utilizare vor fi completate din documentația oficială a producătorului. " +
  "Până atunci, acest text este doar demonstrativ.";

const safetyPlaceholder =
  "Informațiile de siguranță vor fi completate din documentația oficială a producătorului.\n\n" +
  "- A nu se lăsa la îndemâna copiilor.\n- Citește întotdeauna eticheta produsului înainte de utilizare.";

export const demoUsage = usagePlaceholder;
export const demoSafety = safetyPlaceholder;

export const demoProducts: DemoProduct[] = [
  // ── Individual oils ──────────────────────────────────────────────────────
  {
    slug: "lemon",
    sku: "DEMO-OIL-LEMON",
    name: "Lămâie",
    brand: "botanica-demo",
    category: "uleiuri-citrice",
    productType: "INDIVIDUAL_OIL",
    shortDescription: "Ulei esențial de lămâie — aromă citrică, luminoasă.",
    description:
      "O aromă citrică, vie și curată, care amintește de coaja proaspătă de lămâie. " +
      "Un punct de plecare natural pentru cei care descoperă uleiurile esențiale." +
      demoNote,
    price: 4900,
    stock: 24,
    featured: true,
    tags: ["popular", "pentru-difuzor"],
    needs: [
      ["prospetime", 3],
      ["energie", 2],
      ["casa", 2],
      ["incepator", 1],
    ],
    aromas: [
      ["citric", 5],
      ["proaspat", 4],
    ],
    related: ["wild-orange", "peppermint"],
    daysAgo: 60,
  },
  {
    slug: "peppermint",
    sku: "DEMO-OIL-PEPPERMINT",
    name: "Mentă piperată",
    brand: "botanica-demo",
    category: "uleiuri-din-frunze-si-ierburi",
    productType: "INDIVIDUAL_OIL",
    shortDescription: "Ulei esențial de mentă — aromă răcoroasă și clară.",
    description:
      "O aromă mentolată, răcoroasă, cu o prospețime limpede. " +
      "Potrivită pentru momentele în care îți dorești o atmosferă aerisită." +
      demoNote,
    price: 5400,
    compareAtPrice: 5900,
    stock: 18,
    featured: true,
    tags: ["popular"],
    needs: [
      ["concentrare", 3],
      ["prospetime", 3],
      ["energie", 2],
    ],
    aromas: [
      ["mentolat", 5],
      ["proaspat", 4],
    ],
    related: ["lemon", "tea-tree"],
    daysAgo: 55,
  },
  {
    slug: "lavender",
    sku: "DEMO-OIL-LAVENDER",
    name: "Lavandă",
    brand: "botanica-demo",
    category: "uleiuri-din-flori",
    productType: "INDIVIDUAL_OIL",
    shortDescription: "Ulei esențial de lavandă — aromă florală, delicată.",
    description:
      "O aromă florală, rotundă și liniștitoare, ca un câmp de lavandă la apus. " +
      "Un clasic al ritualurilor de seară." +
      demoNote,
    price: 5900,
    stock: 3,
    featured: true,
    tags: ["popular", "idee-de-cadou"],
    needs: [
      ["relaxare", 3],
      ["seara", 3],
      ["incepator", 2],
      ["ingrijire-personala", 1],
    ],
    aromas: [
      ["floral", 5],
      ["dulce", 2],
    ],
    related: ["amestec-liniste-de-seara", "wild-orange"],
    daysAgo: 50,
  },
  {
    slug: "tea-tree",
    sku: "DEMO-OIL-TEA-TREE",
    name: "Arbore de ceai",
    brand: "botanica-demo",
    category: "uleiuri-din-frunze-si-ierburi",
    productType: "INDIVIDUAL_OIL",
    shortDescription: "Ulei esențial de arbore de ceai — aromă verde, proaspătă.",
    description:
      "O aromă verde, ierboasă, cu o notă ușor lemnoasă. " +
      "Completează frumos o rutină de îngrijire și atmosfera unei case aerisite." +
      demoNote,
    price: 4900,
    stock: 0,
    tags: [],
    needs: [
      ["ingrijire-personala", 3],
      ["casa", 2],
      ["prospetime", 1],
    ],
    aromas: [
      ["proaspat", 4],
      ["lemnos", 2],
      ["pamantiu", 1],
    ],
    related: ["peppermint", "lemon"],
    daysAgo: 45,
  },
  {
    slug: "wild-orange",
    sku: "DEMO-OIL-WILD-ORANGE",
    name: "Portocală dulce",
    brand: "botanica-demo",
    category: "uleiuri-citrice",
    productType: "INDIVIDUAL_OIL",
    shortDescription: "Ulei esențial de portocală sălbatică — aromă dulce, însorită.",
    description:
      "O aromă dulce și însorită, de portocală coaptă. " +
      "Aduce căldură în casă și se împrietenește ușor cu aproape orice alt ulei." +
      demoNote,
    price: 3900,
    stock: 40,
    featured: true,
    tags: ["popular", "pentru-difuzor", "nou"],
    needs: [
      ["energie", 3],
      ["casa", 3],
      ["incepator", 2],
    ],
    aromas: [
      ["citric", 5],
      ["dulce", 4],
    ],
    related: ["lemon", "lavender"],
    daysAgo: 10,
  },

  // ── Blends ───────────────────────────────────────────────────────────────
  {
    slug: "amestec-liniste-de-seara",
    sku: "DEMO-BLEND-EVENING",
    name: "Amestec Liniște de Seară",
    brand: "botanica-demo",
    category: "amestecuri",
    productType: "BLEND",
    shortDescription: "Amestec demonstrativ cu note florale și lemnoase.",
    description:
      "Un amestec gândit pentru finalul zilei, cu note florale moi și o bază lemnoasă caldă." +
      demoNote,
    price: 7900,
    stock: 12,
    tags: ["pentru-difuzor"],
    needs: [
      ["seara", 3],
      ["relaxare", 3],
    ],
    aromas: [
      ["floral", 4],
      ["lemnos", 3],
      ["dulce", 2],
    ],
    related: ["lavender", "difuzor-ceramic-piatra"],
    daysAgo: 30,
  },
  {
    slug: "amestec-dimineata-senina",
    sku: "DEMO-BLEND-MORNING",
    name: "Amestec Dimineață Senină",
    brand: "botanica-demo",
    category: "amestecuri",
    productType: "BLEND",
    shortDescription: "Amestec demonstrativ cu note citrice și mentolate.",
    description:
      "Un amestec luminos pentru începutul zilei, cu citrice și o adiere mentolată." + demoNote,
    price: 7900,
    stock: 9,
    tags: ["nou"],
    needs: [
      ["energie", 3],
      ["concentrare", 2],
      ["prospetime", 2],
    ],
    aromas: [
      ["citric", 4],
      ["mentolat", 3],
      ["proaspat", 3],
    ],
    related: ["lemon", "peppermint"],
    daysAgo: 5,
  },
  {
    slug: "amestec-casa-proaspata",
    sku: "DEMO-BLEND-HOME",
    name: "Amestec Casă Proaspătă",
    brand: "botanica-demo",
    category: "amestecuri",
    productType: "BLEND",
    shortDescription: "Amestec demonstrativ cu note verzi și citrice.",
    description: "Un amestec curat și verde, pentru o casă care miroase a aer proaspăt." + demoNote,
    price: 6900,
    compareAtPrice: 7900,
    stock: 15,
    tags: ["pentru-difuzor"],
    needs: [
      ["casa", 3],
      ["prospetime", 3],
    ],
    aromas: [
      ["proaspat", 5],
      ["citric", 3],
      ["lemnos", 1],
    ],
    related: ["tea-tree", "lemon"],
    daysAgo: 20,
  },

  // ── Kits ─────────────────────────────────────────────────────────────────
  {
    slug: "kit-primii-pasi",
    sku: "DEMO-KIT-START",
    name: "Kit Primii Pași",
    brand: "botanica-demo",
    category: "kituri",
    productType: "KIT",
    shortDescription: "Cinci uleiuri demonstrative pentru a descoperi aromele de bază.",
    description:
      "Un kit care adună cinci arome esențiale într-o singură cutie — un început blând pentru cine descoperă uleiurile." +
      demoNote,
    price: 21900,
    compareAtPrice: 25500,
    stock: 7,
    featured: true,
    tags: ["idee-de-cadou", "popular"],
    needs: [
      ["incepator", 3],
      ["casa", 1],
    ],
    aromas: [
      ["citric", 3],
      ["floral", 2],
      ["mentolat", 2],
    ],
    kitItems: [
      ["lemon", 1],
      ["peppermint", 1],
      ["lavender", 1],
      ["tea-tree", 1],
      ["wild-orange", 1],
    ],
    related: ["difuzor-ceramic-piatra"],
    daysAgo: 40,
  },
  {
    slug: "kit-ritual-de-seara",
    sku: "DEMO-KIT-EVENING",
    name: "Kit Ritual de Seară",
    brand: "botanica-demo",
    category: "kituri",
    productType: "KIT",
    shortDescription: "Set demonstrativ pentru un ritual de seară.",
    description:
      "Un set care pune laolaltă aromele florale și un difuzor, pentru serile liniștite." +
      demoNote,
    price: 27900,
    stock: 4,
    tags: ["idee-de-cadou", "editie-limitata"],
    needs: [
      ["seara", 3],
      ["relaxare", 2],
    ],
    aromas: [
      ["floral", 4],
      ["lemnos", 2],
    ],
    kitItems: [
      ["lavender", 1],
      ["amestec-liniste-de-seara", 1],
      ["difuzor-ceramic-piatra", 1],
    ],
    related: ["lavender"],
    daysAgo: 15,
  },

  // ── Diffusers ────────────────────────────────────────────────────────────
  {
    slug: "difuzor-ceramic-piatra",
    sku: "DEMO-DIFF-STONE",
    name: "Difuzor Ceramic Piatră",
    brand: "atelierul-demo",
    category: "difuzoare",
    productType: "DIFFUSER",
    shortDescription: "Difuzor demonstrativ cu aspect de piatră.",
    description: "Un difuzor cu forme simple, inspirate de pietrele de râu." + demoNote,
    price: 18900,
    stock: 6,
    featured: true,
    tags: ["idee-de-cadou"],
    needs: [
      ["casa", 2],
      ["relaxare", 1],
    ],
    related: ["amestec-liniste-de-seara", "wild-orange"],
    daysAgo: 35,
  },
  {
    slug: "difuzor-lemn-de-nuc",
    sku: "DEMO-DIFF-WALNUT",
    name: "Difuzor Lemn de Nuc",
    brand: "atelierul-demo",
    category: "difuzoare",
    productType: "DIFFUSER",
    shortDescription: "Difuzor demonstrativ cu aspect de lemn.",
    description: "Un difuzor cald, cu aspect de lemn, pentru livingul tău." + demoNote,
    price: 22900,
    compareAtPrice: 25900,
    stock: 2,
    tags: ["nou"],
    needs: [["casa", 2]],
    related: ["amestec-casa-proaspata"],
    daysAgo: 3,
  },

  // ── Accessories ──────────────────────────────────────────────────────────
  {
    slug: "set-flacoane-roll-on",
    sku: "DEMO-ACC-ROLLON",
    name: "Set Flacoane Roll-on",
    brand: "atelierul-demo",
    category: "flacoane-si-roll-on",
    productType: "ACCESSORY",
    shortDescription: "Set demonstrativ de flacoane pentru amestecuri proprii.",
    description: "Flacoane goale pentru a-ți pregăti propriile amestecuri." + demoNote,
    price: 3900,
    stock: 30,
    tags: [],
    needs: [["ingrijire-personala", 1]],
    related: ["lavender"],
    daysAgo: 25,
  },
  {
    slug: "husa-de-calatorie",
    sku: "DEMO-ACC-CASE",
    name: "Husă de Călătorie",
    brand: "atelierul-demo",
    category: "calatorie",
    productType: "ACCESSORY",
    shortDescription: "Husă demonstrativă pentru a-ți lua uleiurile la drum.",
    description: "O husă compactă în care uleiurile tale călătoresc în siguranță." + demoNote,
    price: 5900,
    stock: 11,
    tags: ["format-de-calatorie", "idee-de-cadou"],
    related: ["set-flacoane-roll-on"],
    daysAgo: 28,
  },
  {
    slug: "cutie-de-depozitare-lemn",
    sku: "DEMO-ACC-BOX",
    name: "Cutie de Depozitare din Lemn",
    brand: "atelierul-demo",
    category: "accesorii",
    productType: "ACCESSORY",
    shortDescription: "Cutie demonstrativă pentru a-ți organiza colecția.",
    description: "O cutie simplă pentru a-ți ține uleiurile la adăpost de lumină." + demoNote,
    price: 8900,
    stock: 5,
    tags: ["idee-de-cadou"],
    daysAgo: 70,
  },

  // ── Care ─────────────────────────────────────────────────────────────────
  {
    slug: "ulei-purtator-neutru",
    sku: "DEMO-CARE-CARRIER",
    name: "Ulei Purtător Neutru",
    brand: "botanica-demo",
    category: "ingrijire",
    productType: "OTHER",
    shortDescription: "Ulei purtător demonstrativ, fără parfum.",
    description: "Un ulei neutru, fără aromă, pentru rutina ta de îngrijire." + demoNote,
    price: 3400,
    stock: 20,
    tags: [],
    needs: [
      ["ingrijire-personala", 3],
      ["incepator", 1],
    ],
    related: ["set-flacoane-roll-on", "lavender"],
    daysAgo: 65,
  },
];
