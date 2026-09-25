/** Admin navigation, filtered by permission — pure and unit-tested. */
import { can, type Permission } from "@/services/auth/permissions";

export type AdminNavItem = { href: string; label: string; permission: Permission; icon: string };
export type AdminNavGroup = { title: string; items: AdminNavItem[] };

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "General",
    items: [{ href: "/admin", label: "Panou", permission: "admin:access", icon: "layout" }],
  },
  {
    title: "Vânzări",
    items: [
      { href: "/admin/comenzi", label: "Comenzi", permission: "orders:manage", icon: "receipt" },
      { href: "/admin/clienti", label: "Clienți", permission: "users:manage", icon: "users" },
    ],
  },
  {
    title: "Catalog",
    items: [
      { href: "/admin/produse", label: "Produse", permission: "catalog:edit", icon: "package" },
      { href: "/admin/categorii", label: "Categorii", permission: "catalog:edit", icon: "folder" },
      { href: "/admin/marci", label: "Mărci", permission: "catalog:edit", icon: "badge" },
      { href: "/admin/colectii", label: "Colecții", permission: "catalog:edit", icon: "layers" },
      { href: "/admin/etichete", label: "Etichete", permission: "catalog:edit", icon: "tag" },
      { href: "/admin/nevoi", label: "Nevoi", permission: "catalog:edit", icon: "compass" },
      {
        href: "/admin/arome",
        label: "Profiluri aromatice",
        permission: "catalog:edit",
        icon: "flower",
      },
    ],
  },
];

export function navFor(roles: readonly string[]): AdminNavGroup[] {
  return ADMIN_NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => can(roles, i.permission)),
  })).filter((g) => g.items.length > 0);
}

/** The nav item a path belongs to (longest matching prefix). */
export function activeNavHref(pathname: string, groups: AdminNavGroup[]): string | null {
  const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
  const matches = hrefs.filter(
    (h) => pathname === h || (h !== "/admin" && pathname.startsWith(`${h}/`)),
  );
  return (
    matches.sort((a, b) => b.length - a.length)[0] ?? (pathname === "/admin" ? "/admin" : null)
  );
}
