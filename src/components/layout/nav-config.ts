/** Static navigation. Category links in "Produse" come from the database. */

export type NavLink = { label: string; href: string; description?: string };

export const discoverLinks: NavLink[] = [
  {
    label: "Quiz aromatic",
    href: "/quiz",
    description: "Câteva întrebări și îți arătăm aromele potrivite.",
  },
  {
    label: "După nevoie",
    href: "/descopera/nevoi",
    description: "Relaxare, energie, concentrare, casă și altele.",
  },
  {
    label: "După categorie",
    href: "/descopera/categorii",
    description: "Uleiuri, amestecuri, kit-uri, difuzoare.",
  },
];

export const primaryLinks = {
  home: { label: "Acasă", href: "/" },
  journal: { label: "Jurnal", href: "/jurnal" },
  reviews: { label: "Recenzii", href: "/recenzii" },
  rituals: { label: "Ritualuri", href: "/ritualuri" },
  products: { label: "Produse", href: "/produse" },
  discover: { label: "Descoperă", href: "/descopera" },
  about: { label: "Despre", href: "/despre" },
  contact: { label: "Contact", href: "/contact" },
} satisfies Record<string, NavLink>;

/** Under the categories in the "Produse" menu. */
export const howToBuyLink: NavLink = {
  label: "Cum cumpăr de pe doTERRA",
  href: "/cum-cumpar",
  description: "Nu vindem produse: le cumperi direct de pe site-ul oficial doTERRA.",
};

export const accountLinks = {
  account: { label: "Contul meu", href: "/cont" },
  wishlist: { label: "Salvate", href: "/salvate" },
  search: { label: "Caută", href: "/cautare" },
} satisfies Record<string, NavLink>;

/** The newsletter sign-up in the footer, present on every page. */
export const NEWSLETTER_ANCHOR = "newsletter";

export const exploreLinks: NavLink[] = [
  primaryLinks.journal,
  primaryLinks.reviews,
  primaryLinks.rituals,
  primaryLinks.products,
  { label: "Quiz aromatic", href: "/quiz" },
];

export const aboutLinks: NavLink[] = [
  { label: "Despre noi", href: "/despre" },
  { label: "Cum cumpăr", href: "/cum-cumpar" },
  { label: "Contact", href: "/contact" },
  { label: "Întrebări frecvente", href: "/intrebari-frecvente" },
];

export const legalLinks: NavLink[] = [
  { label: "Termeni și condiții", href: "/termeni-si-conditii" },
  { label: "Politica de confidențialitate", href: "/politica-de-confidentialitate" },
  { label: "Politica de cookies", href: "/politica-cookies" },
  { label: "Transparență afiliere", href: "/transparenta-afiliere" },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
