/** Static navigation. Category links in "Produse" come from the database. */

export type NavLink = { label: string; href: string; description?: string };

export const discoverLinks: NavLink[] = [
  {
    label: "Quiz aromatic",
    href: "/quiz",
    description: "Câteva întrebări și îți recomandăm aromele potrivite.",
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
  {
    label: "Rutine",
    href: "/rutine",
    description: "Ritualuri simple pentru fiecare moment al zilei.",
  },
];

export const primaryLinks = {
  home: { label: "Acasă", href: "/" },
  products: { label: "Produse", href: "/produse" },
  discover: { label: "Descoperă", href: "/descopera" },
  routines: { label: "Rutine", href: "/rutine" },
  journal: { label: "Jurnal", href: "/jurnal" },
  about: { label: "Despre", href: "/despre" },
  contact: { label: "Contact", href: "/contact" },
} satisfies Record<string, NavLink>;

export const accountLinks = {
  account: { label: "Contul meu", href: "/cont" },
  wishlist: { label: "Favorite", href: "/favorite" },
  cart: { label: "Coș", href: "/cos" },
  search: { label: "Caută", href: "/cautare" },
} satisfies Record<string, NavLink>;

export const legalLinks: NavLink[] = [
  { label: "Termeni și condiții", href: "/termeni-si-conditii" },
  { label: "Politica de confidențialitate", href: "/politica-de-confidentialitate" },
  { label: "Politica de cookies", href: "/politica-cookies" },
  { label: "Livrare și retur", href: "/livrare-si-retur" },
];

export const helpLinks: NavLink[] = [
  { label: "Contact", href: "/contact" },
  { label: "Întrebări frecvente", href: "/intrebari-frecvente" },
  { label: "Livrare și retur", href: "/livrare-si-retur" },
];

/**
 * Consumer-protection links. The exact set (ANPC SAL, badges, …) must be
 * confirmed with a legal review before launch — see docs/PROGRESS.md.
 */
export const consumerLinks: NavLink[] = [{ label: "ANPC", href: "https://anpc.ro/" }];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
