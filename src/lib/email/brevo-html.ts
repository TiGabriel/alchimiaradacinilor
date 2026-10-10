/**
 * Designed newsletter HTML written for Brevo. Brevo fills its own tags when it
 * sends ({{ unsubscribe }}, {{ mirror }}, {{ contact.FIRSTNAME }}, {% if … %});
 * the stored HTML keeps them as they are. Pure: shared by validation and the
 * admin preview.
 */

const UNSUBSCRIBE_TAG = /\{\{\s*unsubscribe\s*\}\}/;

/** Every marketing email must let the reader unsubscribe; Brevo fills this tag with the link. */
export function hasUnsubscribeTag(html: string): boolean {
  return UNSUBSCRIBE_TAG.test(html);
}

/**
 * The HTML as a reader would see it, for the admin preview: conditional
 * blocks keep their content, contact tags get a sample value and links that
 * only Brevo can build (unsubscribe, mirror…) point nowhere.
 */
export function previewBrevoHtml(html: string, sample: { firstName: string }): string {
  return html
    .replace(/\{\{\s*contact\.FIRSTNAME\s*\}\}/g, sample.firstName)
    .replace(/\{\{\s*contact\.[A-Z0-9_]+\s*\}\}/g, "")
    .replace(/\{%[\s\S]*?%\}/g, "")
    .replace(/\{\{[\s\S]*?\}\}/g, "#");
}
