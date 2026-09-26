"use server";

import { can } from "@/services/auth/permissions";

import { getCurrentUser } from "./session";

export type ClientUser = {
  firstName: string;
  email: string;
  emailVerified: boolean;
  isStaff: boolean;
};

/** Minimal, non-sensitive view of the signed-in user for client components. */
export async function getSessionUserAction(): Promise<ClientUser | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    firstName: user.firstName,
    email: user.email,
    emailVerified: user.emailVerified,
    isStaff: can(user.roles, "admin:access"),
  };
}
