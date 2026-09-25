"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Field, Textarea } from "@/components/ui/input";

import { FormMessage, SubmitButton, TextField } from "../auth/components/form-bits";
import { idleState } from "../auth/form-state";

import { sendContactMessageAction } from "./actions";

export function ContactForm({ defaults }: { defaults?: { name?: string; email?: string } }) {
  const [state, action] = useActionState(sendContactMessageAction, idleState);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="c-name"
          name="name"
          label="Nume"
          autoComplete="name"
          required
          state={state}
          defaultValue={defaults?.name}
        />
        <TextField
          id="c-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          state={state}
          defaultValue={defaults?.email}
        />
      </div>
      <TextField id="c-subject" name="subject" label="Subiect (opțional)" state={state} />
      <Field id="c-message" label="Mesaj" required error={state.errors?.message}>
        {(p) => <Textarea {...p} name="message" rows={6} defaultValue={state.values?.message} />}
      </Field>
      {/* Honeypot — hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="c-website">Website</label>
        <input id="c-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-xs text-ink-muted">
        Folosim datele tale doar pentru a-ți răspunde. Detalii în{" "}
        <Link href="/politica-de-confidentialitate" className="underline underline-offset-2">
          Politica de confidențialitate
        </Link>
        .
      </p>
      <SubmitButton className="self-start" block={false}>
        Trimite mesajul
      </SubmitButton>
    </form>
  );
}
