/**
 * Shared, responsive HTML email layout (table-based, inline styles — what
 * email clients support). Every template returns both HTML and plain text.
 * Order, status and newsletter emails reuse this layout later.
 */

export type EmailBlock =
  | { type: "paragraph"; text: string }
  | { type: "button"; label: string; href: string }
  | { type: "note"; text: string }
  | { type: "code"; text: string }
  | { type: "list"; items: string[] }
  | { type: "divider" };

export type EmailContent = {
  subject: string;
  /** Hidden preview text shown in inbox lists. */
  preheader: string;
  heading: string;
  blocks: EmailBlock[];
  footer?: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

export type EmailBrand = { siteName: string; siteUrl: string };

const colors = {
  paper: "#f8f4ec",
  surface: "#fffdf9",
  ink: "#1e2620",
  muted: "#5b6358",
  line: "#e2d9c9",
  forest: "#2d4a3a",
  inverse: "#f8f4ec",
};

const fontSans = "'Manrope', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const fontSerif = "'Fraunces', Georgia, 'Times New Roman', serif";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeHref(href: string): string {
  return /^(https?:|mailto:)/i.test(href) ? escapeHtml(href) : "#";
}

function renderBlock(block: EmailBlock): string {
  switch (block.type) {
    case "paragraph":
      return `<p style="margin:0 0 16px;font:16px/1.65 ${fontSans};color:${colors.ink};">${escapeHtml(block.text)}</p>`;
    case "note":
      return `<p style="margin:0 0 16px;font:13px/1.6 ${fontSans};color:${colors.muted};">${escapeHtml(block.text)}</p>`;
    case "code":
      return `<p style="margin:0 0 16px;padding:12px 16px;background:${colors.paper};border-radius:8px;font:14px/1.5 monospace;color:${colors.ink};word-break:break-all;">${escapeHtml(block.text)}</p>`;
    case "list":
      return `<ul style="margin:0 0 16px;padding-left:20px;font:16px/1.65 ${fontSans};color:${colors.ink};">${block.items
        .map((i) => `<li style="margin:0 0 6px;">${escapeHtml(i)}</li>`)
        .join("")}</ul>`;
    case "divider":
      return `<hr style="border:0;border-top:1px solid ${colors.line};margin:24px 0;" />`;
    case "button":
      return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 24px;"><tr><td style="border-radius:999px;background:${colors.forest};">
<a href="${safeHref(block.href)}" style="display:inline-block;padding:14px 28px;font:600 15px/1 ${fontSans};color:${colors.inverse};text-decoration:none;border-radius:999px;">${escapeHtml(block.label)}</a>
</td></tr></table>`;
  }
}

function renderBlockText(block: EmailBlock): string {
  switch (block.type) {
    case "paragraph":
    case "note":
    case "code":
      return block.text;
    case "list":
      return block.items.map((i) => `• ${i}`).join("\n");
    case "divider":
      return "—";
    case "button":
      return `${block.label}: ${block.href}`;
  }
}

export function renderEmail(content: EmailContent, brand: EmailBrand): RenderedEmail {
  const footer =
    content.footer ??
    `Primești acest email deoarece ai interacționat cu ${brand.siteName}. Dacă nu tu ai făcut această acțiune, poți ignora mesajul.`;

  const html = `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(content.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${colors.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${colors.paper};">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 8px 20px;font:500 22px/1.2 ${fontSerif};color:${colors.forest};">
<a href="${safeHref(brand.siteUrl)}" style="color:${colors.forest};text-decoration:none;">${escapeHtml(brand.siteName)}</a>
</td></tr>
<tr><td style="background:${colors.surface};border:1px solid ${colors.line};border-radius:16px;padding:36px 32px;">
<h1 style="margin:0 0 20px;font:400 28px/1.2 ${fontSerif};color:${colors.ink};">${escapeHtml(content.heading)}</h1>
${content.blocks.map(renderBlock).join("\n")}
</td></tr>
<tr><td style="padding:20px 8px 0;font:12px/1.6 ${fontSans};color:${colors.muted};">
${escapeHtml(footer)}<br />
<a href="${safeHref(brand.siteUrl)}" style="color:${colors.muted};">${escapeHtml(brand.siteUrl.replace(/^https?:\/\//, ""))}</a>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    brand.siteName,
    "",
    content.heading,
    "",
    ...content.blocks.map(renderBlockText).flatMap((t) => [t, ""]),
    "—",
    footer,
    brand.siteUrl,
  ].join("\n");

  return { subject: content.subject, html, text };
}
