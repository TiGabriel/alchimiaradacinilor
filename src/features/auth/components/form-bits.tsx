"use client";

import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { FormState } from "../form-state";

export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" block loading={pending} {...props}>
      {children}
    </Button>
  );
}

/** Form-level message with a live region so screen readers hear the outcome. */
export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  if (!state.message) return <div aria-live="polite" className="sr-only" />;
  const ok = state.status === "success";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={cn(
        "flex items-start gap-2 rounded-lg p-4 text-sm",
        ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger",
        className,
      )}
    >
      {ok ? (
        <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0" />
      ) : (
        <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      )}
      <span>{state.message}</span>
    </div>
  );
}

type TextFieldProps = {
  id: string;
  name: string;
  label: string;
  state: FormState;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  defaultValue?: string;
};

export function TextField({
  id,
  name,
  label,
  state,
  type = "text",
  autoComplete,
  required,
  hint,
  defaultValue,
}: TextFieldProps) {
  return (
    <Field id={id} label={label} error={state.errors?.[name]} hint={hint} required={required}>
      {(p) => (
        <Input
          {...p}
          name={name}
          type={type}
          autoComplete={autoComplete}
          defaultValue={state.values?.[name] ?? defaultValue}
        />
      )}
    </Field>
  );
}

export function PasswordField({
  id,
  name,
  label,
  state,
  autoComplete,
  hint,
}: {
  id: string;
  name: string;
  label: string;
  state: FormState;
  autoComplete: "current-password" | "new-password";
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Field id={id} label={label} error={state.errors?.[name]} hint={hint} required>
      {(p) => (
        <div className="relative">
          <Input
            {...p}
            name={name}
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-1 my-auto grid size-9 place-items-center rounded-full text-ink-muted hover:text-ink"
            aria-label={visible ? "Ascunde parola" : "Arată parola"}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff aria-hidden className="size-4" />
            ) : (
              <Eye aria-hidden className="size-4" />
            )}
          </button>
        </div>
      )}
    </Field>
  );
}
