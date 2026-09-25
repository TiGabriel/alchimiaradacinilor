"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import { loginAction } from "../actions";
import { idleState } from "../form-state";

import { FormMessage, PasswordField, SubmitButton, TextField } from "./form-bits";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, idleState);

  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        required
        state={state}
      />
      <PasswordField
        id="password"
        name="password"
        label="Parolă"
        autoComplete="current-password"
        state={state}
      />
      <Link
        href="/cont/resetare-parola"
        className="-mt-2 self-end text-sm font-semibold text-forest underline-offset-2 hover:underline"
      >
        Ai uitat parola?
      </Link>
      <SubmitButton>Autentifică-te</SubmitButton>
      <p className="text-center text-sm text-ink-muted">
        Nu ai cont?{" "}
        <Link
          href={next ? `/cont/inregistrare?next=${encodeURIComponent(next)}` : "/cont/inregistrare"}
          className="font-semibold text-forest underline underline-offset-2"
        >
          Creează unul acum
        </Link>
      </p>
    </form>
  );
}
