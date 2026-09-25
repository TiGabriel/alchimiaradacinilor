"use client";

import { useActionState } from "react";

import { resendVerificationAction } from "../actions";
import { idleState } from "../form-state";

import { FormMessage, SubmitButton } from "./form-bits";

export function ResendVerificationForm({ compact = false }: { compact?: boolean }) {
  const [state, action] = useActionState(resendVerificationAction, idleState);
  return (
    <form action={action} className="flex flex-col gap-3">
      <FormMessage state={state} />
      {state.status !== "success" ? (
        <SubmitButton
          size={compact ? "sm" : "lg"}
          block={!compact}
          variant={compact ? "outline" : "primary"}
        >
          Retrimite emailul de confirmare
        </SubmitButton>
      ) : null}
    </form>
  );
}
