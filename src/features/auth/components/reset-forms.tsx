"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { requestPasswordResetAction, resetPasswordAction, verifyEmailAction } from "../actions";
import { idleState } from "../form-state";

import { FormMessage, PasswordField, SubmitButton, TextField } from "./form-bits";

export function RequestResetForm() {
  const [state, action] = useActionState(requestPasswordResetAction, idleState);
  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-5">
        <FormMessage state={state} />
        <Button asChild variant="outline">
          <Link href="/cont/autentificare">Înapoi la autentificare</Link>
        </Button>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        state={state}
      />
      <SubmitButton>Trimite linkul de resetare</SubmitButton>
    </form>
  );
}

export function SetNewPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, idleState);
  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-5">
        <FormMessage state={state} />
        <Button asChild>
          <Link href="/cont/autentificare">Autentifică-te</Link>
        </Button>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <PasswordField
        id="password"
        name="password"
        label="Parola nouă"
        autoComplete="new-password"
        hint="Minimum 10 caractere, cu cel puțin o literă și o cifră."
        state={state}
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmă parola nouă"
        autoComplete="new-password"
        state={state}
      />
      <SubmitButton>Salvează parola nouă</SubmitButton>
    </form>
  );
}

/** Verification requires a click (a POST), so link scanners cannot consume the token. */
export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action] = useActionState(verifyEmailAction, idleState);
  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-5">
        <FormMessage state={state} />
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/cont">Mergi la contul tău</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/produse">Descoperă produsele</Link>
          </Button>
        </div>
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="token" value={token} />
      <SubmitButton>Confirmă adresa de email</SubmitButton>
    </form>
  );
}
