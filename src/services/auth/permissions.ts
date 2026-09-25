/** Role-based permissions (pure). Roles live in the DB; their capabilities live here. */

export const ROLES = ["customer", "editor", "admin"] as const;
export type RoleKey = (typeof ROLES)[number];

export const PERMISSIONS = [
  "account:manage-own",
  "admin:access",
  "catalog:edit",
  "content:edit",
  "orders:manage",
  "users:manage",
  "settings:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<RoleKey, readonly Permission[]> = {
  customer: ["account:manage-own"],
  editor: ["account:manage-own", "admin:access", "catalog:edit", "content:edit"],
  admin: PERMISSIONS,
};

function isRole(value: string): value is RoleKey {
  return (ROLES as readonly string[]).includes(value);
}

export function can(roles: readonly string[], permission: Permission): boolean {
  return roles.some((role) => isRole(role) && ROLE_PERMISSIONS[role].includes(permission));
}

export function hasRole(roles: readonly string[], role: RoleKey): boolean {
  return roles.includes(role);
}
