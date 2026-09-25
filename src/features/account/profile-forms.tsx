"use client";

import { useActionState } from "react";

import { Field, Input } from "@/components/ui/input";

import { FormMessage, PasswordField, SubmitButton, TextField } from "../auth/components/form-bits";
import { idleState } from "../auth/form-state";

import {
  changePasswordAction,
  setNewsletterAction,
  setPersonalizationAction,
  signOutOtherDevicesAction,
  updateProfileAction,
} from "./actions";

export function ProfileForm({
  profile,
}: {
  profile: { firstName: string; lastName: string; phone: string | null; email: string };
}) {
  const [state, action] = useActionState(updateProfileAction, idleState);
  return (
    <form action={action} noValidate className="flex max-w-xl flex-col gap-5">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="firstName"
          name="firstName"
          label="Prenume"
          autoComplete="given-name"
          required
          state={state}
          defaultValue={profile.firstName}
        />
        <TextField
          id="lastName"
          name="lastName"
          label="Nume"
          autoComplete="family-name"
          required
          state={state}
          defaultValue={profile.lastName}
        />
      </div>
      <Field
        id="email"
        label="Email"
        hint="Adresa de email nu poate fi schimbată momentan. Scrie-ne dacă ai nevoie de ajutor."
      >
        {(p) => <Input {...p} value={profile.email} readOnly disabled />}
      </Field>
      <TextField
        id="phone"
        name="phone"
        type="tel"
        label="Telefon (opțional)"
        autoComplete="tel"
        state={state}
        defaultValue={profile.phone ?? ""}
      />
      <SubmitButton className="self-start" block={false}>
        Salvează
      </SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, idleState);
  return (
    <form
      action={action}
      noValidate
      className="flex max-w-xl flex-col gap-5"
      key={state.status === "success" ? "done" : "form"}
    >
      <FormMessage state={state} />
      <PasswordField
        id="currentPassword"
        name="currentPassword"
        label="Parola actuală"
        autoComplete="current-password"
        state={state}
      />
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
      <SubmitButton className="self-start" block={false}>
        Schimbă parola
      </SubmitButton>
    </form>
  );
}

export function SignOutOthersForm() {
  const [state, action] = useActionState(signOutOtherDevicesAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormMessage state={state} />
      <SubmitButton variant="outline" block={false} size="md" className="self-start">
        Deconectează celelalte dispozitive
      </SubmitButton>
    </form>
  );
}

export function NewsletterToggle({ subscribed }: { subscribed: boolean }) {
  const [state, action] = useActionState(setNewsletterAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormMessage state={state} />
      <input type="hidden" name="subscribe" value={subscribed ? "0" : "1"} />
      <SubmitButton
        variant={subscribed ? "outline" : "primary"}
        block={false}
        size="md"
        className="self-start"
      >
        {subscribed ? "Retrage consimțământul și dezabonează-mă" : "Abonează-mă la newsletter"}
      </SubmitButton>
    </form>
  );
}

export function PersonalizationToggle({ granted }: { granted: boolean }) {
  const [state, action] = useActionState(setPersonalizationAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormMessage state={state} />
      <input type="hidden" name="personalize" value={granted ? "0" : "1"} />
      <SubmitButton variant="outline" block={false} size="md" className="self-start">
        {granted ? "Nu mai folosi activitatea mea" : "Permite recomandări personalizate"}
      </SubmitButton>
    </form>
  );
}
