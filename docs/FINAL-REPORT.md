# Final report

State of the project at the end of Phase 14 (2026-09-26). Setup and deployment: `README.md`.
Audit details and Lighthouse scores: `docs/AUDIT.md`. Decisions: `docs/DECISIONS.md`.

## Customer review (Phase 14)

Reviewed as a first-time visitor on mobile (390 px), tablet (820 px) and desktop (1440 px):
homepage, catalogue, category, product, search, quiz, discovery, routines, journal, cart, checkout,
account and admin. Findings that were fixed are marked ✔.

**Does the homepage immediately explain what Alchimia Rădăcinilor is?** Yes. The first screen
says "Uleiuri esențiale · Ritualuri botanice", the heading promises simple rituals, the subtitle
names the products (oils, blends, step-by-step rituals) and the two buttons are "Descoperă
produsele" and "Găsește ce ți se potrivește". Without a hero photo the right side is a botanical
illustration; a real photo (Admin → Setări → Pagina principală) will make it warmer.

**Can a first-time visitor who knows nothing about essential oils find a product?** Yes, by three
routes: the need picker right under the hero ("Ce cauți? Relaxare, Seară, Concentrare…"), the
quiz, and "Cele 5 esențiale" — five oils with one plain sentence each. Product pages describe
aroma and moments instead of technical terms. ✔ The five demo oils had English names (Lavender,
Lemon…) next to Romanian blends; they are now Lavandă, Lămâie, Mentă piperată, Portocală dulce and
Arbore de ceai.

**Can someone find products by need? Is the quiz useful?** Yes. `/descopera/<nevoie>` gathers
products, routines and articles for each need. The quiz has 8 short questions (some optional),
works without an account, and every recommendation says why it was chosen ("Recomandat pentru
că ai ales: Seară + Floral + Relaxare"); a budget answer actually filters. Its usefulness depends
on the real catalogue and on the weights, which the admin can tune with the live preview.
✔ The quiz intro said "about a minute" while the homepage said "two minutes" — now consistent.

**Is creating an account easy? Can people save their preferences? Can they order without
friction?** Registration is one short form (name, email, password, privacy consent), with email
verification; the guest cart and favourites move into the account at login. Preferences,
favourites, saved routines, quiz results, recommendations (opt-in), addresses and newsletter
interests are all saved. Checkout is a single page (address, delivery, payment, summary) with
server-recomputed totals and field-level errors. One deliberate friction: ordering requires a
verified email — the cart explains it and keeps its contents; a guest checkout could be added
later if the owner prefers.

**Does the site feel trustworthy and premium, like a brand rather than a template?** Mostly yes:
consistent botanical illustrations, a restrained palette, Fraunces/Manrope typography, calm copy,
transparent prices (VAT, shipping before ordering), verified-purchase reviews, clear legal pages.
What still reads as unfinished is the **demo content**: product "photos" are illustrated
placeholders and every demo item carries a "Demo" badge (intentionally). Real photography is the
single biggest improvement left.

**Is it beautiful on mobile? Are the animations subtle and polished?** Yes. No horizontal
scrolling on any page at 390 px, a bottom navigation bar, a full-height menu, sticky checkout
summary. Animations are short rises and fades revealed on scroll; with reduced motion everything
appears at once (checked). The hero heading is never animated (it is the LCP element).

**Broken links, fake claims, medical claims, empty-looking sections, missing states, wrong SEO
previews?**

- Links: every sitemap URL (59) and every account/admin page returns 200; the 404 page offers
  search and the main sections.
- ✔ "Despre" and "Întrebări frecvente" were "page in preparation" placeholders linked from the
  header, footer and homepage. Both now have real content: the FAQ answers (delivery prices,
  payment methods) are built from the site settings, and it carries FAQPage structured data.
- Medical claims: none in the copy; the admin refuses common therapeutic wording on products,
  taxonomy and content. The FAQ says explicitly that the shop makes no such claims.
- Fake content: reviews shown on the homepage are real, moderated reviews (none are seeded);
  ratings and counts come from them. Demo data is flagged everywhere.
- States: empty, error and success states exist for catalogue filters, search, cart,
  favourites, orders, quiz results and admin lists; the parts loaded in the browser (cart,
  favourites, search palette) show skeletons or spinners. There are no route-level `loading.tsx`
  files on purpose (D-017); a site-wide error page and 404 page exist.
- SEO/social: every public page has its own title, description, canonical, Open Graph and
  Twitter tags with a branded default image (Phase 13).

**Is the Romanian copy natural, free of clichés, consistent in diacritics?** Yes — comma-below
ș/ț throughout (checked in code and seed data), a calm "tu" voice, short sentences. The copy
avoids superlatives and pressure ("ultimele bucăți!" style) by design. Legal pages keep visible
"[De completat: …]" markers where the owner's data is required.

## Production-ready

- Storefront: catalogue with facets and pagination, product pages, instant search, favourites,
  cart (guest and account, merged at login), coupons, single-page checkout with stock locking and
  server-side pricing, order numbers, order history and status emails.
- Discovery: quiz with explained recommendations, discovery by need and category, routines
  (add the whole routine to the cart), journal with product/routine cards and draft preview.
- Accounts: registration, email verification, login with rate limits, password reset, sessions,
  addresses, preferences, consent records, newsletter double opt-in and one-click unsubscribe.
- Reviews: verified-purchase only, optional photo, moderation, rating cache.
- Admin: dashboard, products (images, SEO), taxonomy (category SEO), orders (status flow, mark
  paid), customers, quiz editor with preview, routines, journal, reviews, newsletter (segments,
  CSV, campaigns), coupons with stats, site settings — with role-based permissions checked in
  pages, actions and services.
- Privacy: cookie consent before analytics, first-party consent-gated analytics, personalisation
  only with consent, IPs stored only as salted hashes.
- Security: nonce-based CSP, security headers, validated and re-encoded uploads, Zod on every
  input, rate limits, CSV injection guard, clean dependency audit.
- Quality: 289 unit and 85 integration tests (auth, quiz scoring, recommendations, cart, order
  creation, coupons, permissions, consent, content, SEO, settings), Lighthouse accessibility, best
  practices and SEO 100 on the audited pages, axe-core clean on 27 pages.

## Needs real content

- **Products:** real names, photos (several per product; the first is the thumbnail), official
  descriptions, volumes, ingredients/composition, usage and safety texts from the producers —
  never invented. Then delete demo rows (`isDemo = true`) or seed production with
  `SEED_DEMO=false`.
- **Brand:** logo image, hero photo, the founders' story on "Despre" (the page currently states the
  shop's principles only), social profile links.
- **Legal (review by a lawyer):** company name, CUI, trade register number, address and contact on
  the terms and privacy pages; courier names and delivery times; return address and procedure;
  ANPC SAL/SOL badges; cookie and privacy policies checked against the final set of services.
  Every gap is marked "[De completat: …]".
- **Routines and journal:** replace or rewrite the demo routines and articles; add cover images.
- **Quiz:** review the questions and weights against the real catalogue (use the admin preview).
- **Settings:** shipping methods and prices, free-shipping threshold, bank details for
  transfers, email sender name and reply-to, SEO defaults, VAT rate confirmed with the accountant.

## Needs credentials

- Managed PostgreSQL (production and, ideally, a separate preview database).
- S3-compatible storage (bucket, access key, public URL or CDN domain).
- Email provider (Resend API key or SMTP account) and the DNS records for the domain.
- `AUTH_SECRET` (random, ≥ 32 characters).
- Vercel project and DNS access at hostgate.ro.
- Optional: a card payment provider (Stripe or Netopia) — see `docs/PAYMENTS.md`.

## Suggested next steps

1. Load the real catalogue and photos; run the quiz preview against it; remove demo data.
2. Legal review and company details; courier contract and delivery times.
3. Deploy to Vercel with the production services; configure DNS; submit the sitemap in Google
   Search Console; set up uptime monitoring and error tracking (e.g. Sentry).
4. Card payments through Stripe or Netopia (interface ready), plus e-invoicing (e-Factura/SmartBill)
   if the accounting setup requires it.
5. Shared rate-limit store (Upstash Redis) when running on several serverless instances; a
   scheduled job to delete expired guest carts and old analytics events.
6. Account self-service for data export/deletion and email change (today handled by email, as the
   privacy policy says).
7. Once there is traffic: a cross-request data cache with tag revalidation from the admin actions
   (D-075), `display: "optional"` for the display font if field data shows slow LCP, and A/B-free
   iteration on the quiz using the consented analytics funnel in the dashboard.

## Phase 14 checklist

- [x] `pnpm typecheck`, `pnpm lint`, `pnpm format:check` pass
- [x] `pnpm test` (289) and `pnpm test:integration` (85) pass; new logic has tests
- [x] `pnpm build` passes
- [x] Migrations committed (no schema change in this phase); `pnpm db:seed` idempotent, with and
      without `SEED_DEMO=false`
- [x] Romanian copy with correct diacritics; no medical or therapeutic claims
- [x] Mobile, tablet and desktop checked; no broken links or dead ends
- [x] Keyboard, focus, labels (axe-core) and reduced motion checked
- [x] No secrets committed; every environment variable documented in `.env.example`
- [x] `docs/PROGRESS.md` and `docs/DECISIONS.md` updated
