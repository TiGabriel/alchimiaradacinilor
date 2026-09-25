/** Shared shape for useActionState-based forms. */
export type FormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  /** Echoed back so fields keep their values after a failed submit (never passwords). */
  values?: Record<string, string>;
  /** Client navigates here (full reload so every provider picks up the new session). */
  redirectTo?: string;
};

export const idleState: FormState = { status: "idle" };

export function formValues(formData: FormData, keys: string[]): Record<string, string> {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}
