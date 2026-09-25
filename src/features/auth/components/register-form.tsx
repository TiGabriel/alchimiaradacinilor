"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import { Checkbox } from "@/components/ui/checkbox";

import { registerAction } from "../actions";
import { idleState } from "../form-state";

import { FormMessage, PasswordField, SubmitButton, TextField } from "./form-bits";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState(registerAction, idleState);

  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="firstName"
          name="firstName"
          label="Prenume"
          autoComplete="given-name"
          required
          state={state}
        />
        <TextField
          id="lastName"
          name="lastName"
          label="Nume"
          autoComplete="family-name"
          required
          state={state}
        />
      </div>
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
        autoComplete="new-password"
        hint="Minimum 10 caractere, cu cel puțin o literă și o cifră."
        state={state}
      />
      <PasswordField
        id="confirmPassword"
        name="confirmPassword"
        label="Confirmă parola"
        autoComplete="new-password"
        state={state}
      />

      <fieldset className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5">
        <legend className="px-1 text-sm font-semibold">Consimțământ</legend>
        <div className="flex flex-col gap-1.5">
          <Checkbox
            id="privacyConsent"
            name="privacyConsent"
            value="on"
            required
            aria-invalid={state.errors?.privacyConsent ? true : undefined}
            aria-describedby={state.errors?.privacyConsent ? "privacyConsent-error" : undefined}
            label={
              <>
                Sunt de acord cu prelucrarea datelor mele personale conform{" "}
                <Link
                  href="/politica-de-confidentialitate"
                  target="_blank"
                  className="font-semibold text-forest underline underline-offset-2"
                >
                  Politicii de confidențialitate
                </Link>
                . <span className="text-xs font-semibold text-clay">(obligatoriu)</span>
              </>
            }
          />
          {state.errors?.privacyConsent ? (
            <p id="privacyConsent-error" className="pl-8 text-sm font-medium text-danger">
              {state.errors.privacyConsent}
            </p>
          ) : null}
        </div>
        <div className="border-t border-line pt-4">
          {/* Optional and never pre-checked. */}
          <Checkbox
            id="marketingConsent"
            name="marketingConsent"
            value="on"
            defaultChecked={false}
            label={
              <>
                Vreau să primesc newslettere, oferte speciale, recomandări personalizate și reduceri
                pe email. <span className="text-xs text-ink-muted">(opțional)</span>
              </>
            }
            description="Te poți dezabona oricând din contul tău sau din orice email."
          />
        </div>
      </fieldset>

      <SubmitButton>Creează contul</SubmitButton>
      <p className="text-center text-sm text-ink-muted">
        Ai deja cont?{" "}
        <Link
          href={
            next ? `/cont/autentificare?next=${encodeURIComponent(next)}` : "/cont/autentificare"
          }
          className="font-semibold text-forest underline underline-offset-2"
        >
          Autentifică-te
        </Link>
      </p>
    </form>
  );
}
