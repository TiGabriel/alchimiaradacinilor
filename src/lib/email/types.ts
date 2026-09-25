export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Display name for the sender; the address always comes from EMAIL_FROM. */
  fromName?: string;
  /** Extra headers, e.g. List-Unsubscribe for newsletters. */
  headers?: Record<string, string>;
};

/**
 * Honest delivery outcome — callers must never report success for anything
 * other than "sent" (or "logged" in development).
 */
export type SendResult =
  | { status: "sent"; id?: string }
  | { status: "logged" }
  | { status: "disabled"; reason: string }
  | { status: "failed"; error: string };

export interface EmailProvider {
  readonly name: string;
  send(message: EmailMessage & { from: string }): Promise<SendResult>;
}

export function isDelivered(result: SendResult): boolean {
  return result.status === "sent" || result.status === "logged";
}
