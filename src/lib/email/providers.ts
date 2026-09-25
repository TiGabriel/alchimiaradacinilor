import type { EmailProvider } from "./types";

/** Development only: prints the message (and any links) to the server console. */
export const consoleProvider: EmailProvider = {
  name: "console",
  async send(message) {
    const links = [...message.text.matchAll(/https?:\/\/\S+/g)].map((m) => m[0]);
    console.info(
      [
        "──── email (console provider — not sent) ────",
        `From:    ${message.from}`,
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        ...(links.length ? ["Links:", ...links.map((l) => `  ${l}`)] : []),
        "─────────────────────────────────────────────",
      ].join("\n"),
    );
    return { status: "logged" };
  },
};

/** Resend over its HTTP API (no SDK needed). */
export function resendProvider(apiKey: string): EmailProvider {
  return {
    name: "resend",
    async send(message) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: message.from,
            to: [message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(message.replyTo ? { reply_to: message.replyTo } : {}),
          }),
        });
        if (!res.ok)
          return {
            status: "failed",
            error: `Resend ${res.status}: ${(await res.text()).slice(0, 300)}`,
          };
        const body = (await res.json()) as { id?: string };
        return { status: "sent", id: body.id };
      } catch (error) {
        return { status: "failed", error: error instanceof Error ? error.message : String(error) };
      }
    },
  };
}

export function smtpProvider(config: {
  host: string;
  port: number;
  user?: string;
  password?: string;
}): EmailProvider {
  return {
    name: "smtp",
    async send(message) {
      try {
        const nodemailer = await import("nodemailer");
        const transport = nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.port === 465,
          auth: config.user ? { user: config.user, pass: config.password } : undefined,
        });
        const info = await transport.sendMail({
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: message.replyTo,
        });
        return { status: "sent", id: info.messageId };
      } catch (error) {
        return { status: "failed", error: error instanceof Error ? error.message : String(error) };
      }
    },
  };
}
