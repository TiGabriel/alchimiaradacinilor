"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { isDelivered } from "@/lib/email";
import {
  AuthError,
  authenticate,
  createEmailVerificationToken,
  createPasswordResetToken,
  registerUser,
  resetPassword,
  verifyEmail,
} from "@/services/auth/accounts";
import { limiters, retryAfterText } from "@/services/auth/rate-limit";
import { createSession, deleteSession } from "@/services/auth/sessions";
import {
  fieldErrors,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetRequestSchema,
  safeNextPath,
} from "@/validation/auth";

import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "./emails";
import { formValues, type FormState } from "./form-state";
import { onSignedIn } from "./on-sign-in";
import {
  clearSessionCookie,
  getCurrentSession,
  getRequestMeta,
  requireUser,
  SESSION_COOKIE,
  setSessionCookie,
} from "./session";

function tooMany(retryAfterMs: number): FormState {
  return {
    status: "error",
    message: `Prea multe încercări. Te rugăm să mai încerci peste ${retryAfterText(retryAfterMs)}.`,
  };
}

async function startSession(userId: string) {
  const meta = await getRequestMeta();
  const { token } = await createSession(userId, { ipAddress: meta.ip, userAgent: meta.userAgent });
  await setSessionCookie(token);
  await onSignedIn(userId);
}

// ── Register ────────────────────────────────────────────────────────────────

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["firstName", "lastName", "email"]);
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  // Counted after validation, so fixing typos never locks anyone out.
  const meta = await getRequestMeta();
  const limit = limiters.registerByIp.check(`register:${meta.ip ?? "unknown"}`);
  if (!limit.allowed) return { ...tooMany(limit.retryAfterMs), values };

  try {
    const user = await registerUser(parsed.data, {
      source: "inregistrare",
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
    });
    const token = await createEmailVerificationToken(user.id);
    const sent = await sendVerificationEmail(user, token);
    await startSession(user.id);
    const next = safeNextPath(formData.get("next"), "/cont");
    return {
      status: "success",
      redirectTo: `${next}${next.includes("?") ? "&" : "?"}${isDelivered(sent) ? "bun-venit=1" : "email-netrimis=1"}`,
    };
  } catch (error) {
    if (error instanceof AuthError && error.code === "email-taken") {
      return { status: "error", errors: { email: error.message }, values };
    }
    console.error("[auth] register failed", error);
    return {
      status: "error",
      message: "Nu am putut crea contul. Te rugăm să încerci din nou.",
      values,
    };
  }
}

// ── Login / logout ──────────────────────────────────────────────────────────

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData, ["email"]);
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const meta = await getRequestMeta();
  const byIp = limiters.loginByIp.check(`login-ip:${meta.ip ?? "unknown"}`);
  const byEmail = limiters.loginByEmail.check(`login-email:${parsed.data.email}`);
  if (!byIp.allowed || !byEmail.allowed)
    return { ...tooMany(Math.max(byIp.retryAfterMs, byEmail.retryAfterMs)), values };

  try {
    const user = await authenticate(parsed.data.email, parsed.data.password);
    limiters.loginByEmail.reset(`login-email:${parsed.data.email}`);
    await startSession(user.id);
    return { status: "success", redirectTo: safeNextPath(formData.get("next"), "/cont") };
  } catch (error) {
    if (error instanceof AuthError) return { status: "error", message: error.message, values };
    console.error("[auth] login failed", error);
    return {
      status: "error",
      message: "Autentificarea nu a reușit. Te rugăm să încerci din nou.",
      values,
    };
  }
}

export async function logoutAction() {
  const jar = await cookies();
  await deleteSession(jar.get(SESSION_COOKIE)?.value);
  await clearSessionCookie();
  redirect("/");
}

// ── Email verification ──────────────────────────────────────────────────────

export async function verifyEmailAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { status: "error", message: "Linkul nu este valid." };
  try {
    const user = await verifyEmail(token);
    await sendWelcomeEmail(user);
    return { status: "success", message: "Adresa ta de email a fost confirmată. Mulțumim!" };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: `${error.message} Poți cere un link nou din contul tău.` };
    }
    console.error("[auth] verify failed", error);
    return {
      status: "error",
      message: "Nu am putut confirma adresa. Te rugăm să încerci din nou.",
    };
  }
}

export async function resendVerificationAction(): Promise<FormState> {
  const session = await requireUser("/cont/verificare-email");
  if (session.user.emailVerified)
    return { status: "success", message: "Adresa ta este deja confirmată." };
  const limit = limiters.verificationResend.check(`verify:${session.user.id}`);
  if (!limit.allowed) return tooMany(limit.retryAfterMs);
  const token = await createEmailVerificationToken(session.user.id);
  const sent = await sendVerificationEmail(session.user, token);
  return isDelivered(sent)
    ? { status: "success", message: `Ți-am trimis un link nou la ${session.user.email}.` }
    : {
        status: "error",
        message:
          "Momentan nu putem trimite emailuri. Te rugăm să încerci mai târziu sau să ne contactezi.",
      };
}

// ── Password reset ──────────────────────────────────────────────────────────

const RESET_SENT =
  "Dacă există un cont cu această adresă, vei primi în câteva minute un email cu instrucțiunile de resetare.";

export async function requestPasswordResetAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const values = formValues(formData, ["email"]);
  const parsed = resetRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), values };

  const meta = await getRequestMeta();
  const byIp = limiters.resetByIp.check(`reset-ip:${meta.ip ?? "unknown"}`);
  const byEmail = limiters.resetByEmail.check(`reset-email:${parsed.data.email}`);
  if (!byIp.allowed || !byEmail.allowed)
    return tooMany(Math.max(byIp.retryAfterMs, byEmail.retryAfterMs));

  const issued = await createPasswordResetToken(parsed.data.email);
  if (issued) {
    const sent = await sendPasswordResetEmail(issued.user, issued.token);
    // Only a delivery outage is reported — never whether the account exists.
    if (sent.status === "disabled" || sent.status === "failed") {
      return {
        status: "error",
        message: "Momentan nu putem trimite emailuri. Te rugăm să încerci mai târziu.",
      };
    }
  }
  return { status: "success", message: RESET_SENT };
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error) };
  try {
    await resetPassword(parsed.data.token, parsed.data.password);
    // Every session was revoked, including this browser's.
    if (await getCurrentSession()) await clearSessionCookie();
    return {
      status: "success",
      message: "Parola a fost schimbată. Te poți autentifica acum cu noua parolă.",
    };
  } catch (error) {
    if (error instanceof AuthError)
      return { status: "error", message: `${error.message} Cere un link nou de resetare.` };
    console.error("[auth] reset failed", error);
    return { status: "error", message: "Nu am putut schimba parola. Te rugăm să încerci din nou." };
  }
}
