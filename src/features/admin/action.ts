import "server-only";

import { z } from "zod";

import { ForbiddenError, type Actor, type Permission } from "@/services/auth/permissions";
import { AdminError } from "@/services/admin/errors";

import { requirePermission } from "../auth/session";

export type AdminResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Every admin Server Action goes through here: the permission is checked on
 * the server (the service checks it again), input errors come back per field
 * and unexpected errors are logged without leaking details.
 */
export async function adminAction<T>(
  permission: Permission,
  run: (actor: Actor) => Promise<T>,
  message?: string,
): Promise<AdminResult<T>> {
  const { user } = await requirePermission(permission);
  try {
    return { ok: true, data: await run({ id: user.id, roles: user.roles }), message };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) fieldErrors[issue.path.join(".")] ??= issue.message;
      return { ok: false, error: "Verifică câmpurile marcate.", fieldErrors };
    }
    if (error instanceof AdminError)
      return { ok: false, error: error.message, fieldErrors: error.fieldErrors };
    if (error instanceof ForbiddenError) return { ok: false, error: error.message };
    console.error("[admin]", error);
    return { ok: false, error: "A apărut o eroare. Încearcă din nou." };
  }
}
