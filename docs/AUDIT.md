# Audit — SEO, performance, security, accessibility (Phase 13)

Run on 2026-09-25/26 against a production build (`pnpm build && pnpm start`) with the demo seed.
Lighthouse 13.5 (headless Chromium, default mobile throttling: slow 4G, 4× CPU; and the desktop
preset). The local server has no CDN or HTTP/2, so absolute numbers are pessimistic; the
before/after comparison is what matters.

## Lighthouse

| Page     | Form    | Perf. before | Perf. after | A11y | Best pr. | SEO | LCP before | LCP after | CLS  | TBT after |
| -------- | ------- | ------------ | ----------- | ---- | -------- | --- | ---------- | --------- | ---- | --------- |
| Home     | mobile  | 64           | 83          | 100  | 100      | 100 | 7.4 s      | 4.5 s     | 0.00 | 133 ms    |
| Home     | desktop | 95           | 99          | 100  | 100      | 100 | 1.5 s      | 1.0 s     | 0.00 | 0 ms      |
| Category | mobile  | 71           | 74          | 100  | 100      | 100 | 7.7 s      | 5.1 s     | 0.00 | 314 ms    |
| Category | desktop | 95           | 98          | 100  | 100      | 100 | 1.5 s      | 1.1 s     | 0.00 | 0 ms      |
| Product  | mobile  | 71           | 81          | 100  | 100      | 100 | 7.3 s      | 4.7 s     | 0.00 | 161 ms    |
| Product  | desktop | 95           | 99          | 100  | 100      | 100 | 1.5 s      | 1.0 s     | 0.00 | 0 ms      |
| Quiz     | mobile  | 69           | 81          | 100  | 100      | 100 | 7.4 s      | 4.9 s     | 0.00 | 136 ms    |
| Quiz     | desktop | 97           | 98          | 100  | 100      | 100 | 1.3 s      | 1.2 s     | 0.00 | 0 ms      |

Before: accessibility 98 on the category page, best practices 96 everywhere.

What still limits mobile: the framework baseline (React + Next.js runtime, ~110 KB gzip), Radix and
Motion on every page, and the display font arriving after first paint (the hero heading is the LCP
element). Next candidates if real-user data (not the lab) shows a problem: `display: "optional"`
for Fraunces (no swap, fallback on a slow first visit), deferring the cart/search providers, a CDN.

## Changes

### SEO

- **One metadata builder for public pages** (`lib/seo.ts` `buildMetadata`, `services/seo.ts`
  `pageMetadata`): canonical, `robots`, complete Open Graph (type, locale, site name, URL, title,
  description, image with alt, article dates/authors) and Twitter `summary_large_image`. Before,
  most pages had no `og:title`/`og:description`/`og:url` and no Twitter tags, and pages that set
  their own `openGraph` lost the site name and locale (Next.js replaces the parent's object).
- **Fallbacks:** description → page text → SEO default setting (clamped to 160 characters at a
  word boundary); image → page image → social image setting → new `public/og-default.png`
  (1200×630, rendered with the site fonts).
- **Complete SEO fields in the admin** (shared `SeoFields` + `upsertSeo`): products, categories,
  routines and articles now have SEO title, meta description, canonical URL (site path or
  http(s) URL, validated), social image upload (1200 px, re-encoded) and noindex. Categories had no
  SEO editing at all; canonical and social image were missing everywhere. The category page reads
  them (falling back to the category image, then the site default).
- **Editor SEO fields are honoured:** `noIndex` on products, routines and articles now produces
  `noindex` (it was ignored) and removes the page from the sitemap; an editor canonical to another
  URL also keeps the page out of the sitemap.
- **Homepage:** own metadata (canonical `/`, absolute title) and Organization + WebSite JSON-LD
  (logo, contact point, social profiles from settings).
- **JSON-LD:** Product images are absolute URLs and the offer links to the organization as seller;
  articles are `BlogPosting` with publisher and absolute image; routines (`HowTo`) gain the image
  and language. Breadcrumbs were already correct.
- **Sitemap:** dedicated queries (`getSitemapContent`), `lastModified` from `updatedAt` for
  routines and articles, legal pages added; "coming soon" pages stay out.
- **robots.txt:** also disallows `/admin`, `/finalizare-comanda`, `/newsletter/`, `/quiz/rezultat/`;
  the non-standard `Host:` line (which carried a full URL) is gone.
- **Icons:** the default create-next-app favicon was replaced by the brand mark (`icon.svg`,
  `favicon.ico` with 16/32/48 px, `apple-icon.png`).
- **Bug fixed on the way:** the journal's "published" filter captured `new Date()` when the module
  loaded, so articles published or scheduled after the server started stayed invisible until a
  restart. It is now evaluated per query.

### Performance

- **Fonts:** Fraunces no longer loads the `opsz` and `SOFT` variation axes. Preloaded font data
  dropped from ~530 KB to ~196 KB; this was the main cause of the slow mobile LCP.
- **Zod out of the browser:** the footer newsletter form, the analytics event helpers and the
  catalog filter parser pulled all of Zod (~85 KB gzip) into every page. The client code now uses
  small hand-written checks; the Zod schemas stay on the server (`lib/analytics/schema.ts`,
  `validation/limits.ts`).
- **Motion:** `LazyMotion` with `domAnimation` and `m.*` components, imported from `framer-motion`
  directly (the `motion/react` entry keeps the whole library alive; see D-074). ~11 KB gzip less.
- **`optimizePackageImports: ["radix-ui"]`** for the Radix umbrella package.
- Resulting JS on the homepage: ~256 KB gzip for modern browsers (the 39 KB polyfill chunk is
  `nomodule`).
- **Caching reviewed, left as is:** pages are dynamic by design (session, cart, consent, nonce);
  queries are small and indexed (TTFB ~85 ms locally), deduplicated per request with React `cache`,
  and the search index has its own 60 s cache. Static assets (`/_next/static`) and uploads are
  served `immutable` for a year. See D-075.

### Security

- **Content Security Policy with a per-request nonce** (`proxy.ts`, `lib/security-headers.ts`):
  `script-src 'self' 'nonce-…' 'strict-dynamic'`, `object-src 'none'`, `frame-ancestors 'none'`,
  `base-uri 'self'`, `form-action 'self'`, S3/CDN image origin when configured,
  `upgrade-insecure-requests` when `APP_URL` is HTTPS. No violations across the public pages, cart,
  quiz, checkout and admin.
- **Headers on every response** (`next.config.ts`): `X-Content-Type-Options`, `Referrer-Policy`,
  `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy`, `Permissions-Policy` (camera, microphone,
  geolocation, topics off) and HSTS when the site runs on HTTPS.
- **Uploads** are additionally served with `Content-Security-Policy: default-src 'none'; sandbox`.
- **Dependencies:** `pnpm audit` reported 2 high and 1 moderate advisory, all in the Prisma CLI's
  transitive dependencies (`deepmerge-ts`, `mysql2`). Fixed with pnpm overrides
  (`pnpm-workspace.yaml`); Prisma validate/generate/migrate verified. `pnpm audit`: no known
  vulnerabilities.
- **API routes:** `/api/search` and `/api/analytics` are rate limited per IP (the analytics limit
  per visitor id alone could be bypassed by rotating ids); analytics beacons from another origin are
  refused (`isSameOrigin`), on top of the `SameSite=Lax` consent cookie. Shared `clientIp()` helper.
- Reviewed, no change needed: Server Actions are origin-checked by Next.js and every admin action
  re-checks the role in the service; login, registration, password reset, contact, newsletter,
  coupons and checkout were already rate limited; Markdown is rendered without raw HTML
  (`skipHtml`, safe URL transform); uploads are sniffed by magic bytes and re-encoded; the CSV export
  checks the session itself; `lib/env` and `lib/db` are `server-only` and no secret names appear in
  the built client bundles.
- Reviewed, no change needed: session/cart/quiz cookies are `httpOnly`, `SameSite=Lax`, `Secure`
  in production; every admin action re-checks permissions in the service layer.

### Database queries

- No read-side N+1: lists use `include`/`select` with the fields they render; loops only contain
  small, deliberate writes inside transactions (per-line stock decrement, image reordering).
- Indexes cover the hot filters (products by category/brand/active+featured, reviews by
  product+status, orders by user/status/date, articles by status+date, analytics by name+date).

### Images

- Every `next/image` has `sizes`; the first product cards and a configured hero photo use
  `priority`; everything else is lazy by default; uploads are re-encoded to WebP with dimensions.

### Accessibility and keyboard

- **Focus returns after dialogs opened from code** (cart drawer after "Adaugă în coș", search
  palette with Ctrl+K): it used to land on `<body>`. New `useReturnFocus`/`FocusOrigin` in
  `components/ui`, used by `DialogContent`, `DrawerContent` and the search palette.
- **Busy buttons keep focus:** `Button loading` now uses `aria-disabled` (plus `aria-busy`) and
  ignores activation instead of `disabled`, which dropped keyboard focus on every async action.
- **Quantity field** shows a focus ring on the pill (the input's own outline was hidden).
- **Logo link:** accessible name now contains the visible text ("label in name").
- **Heading order:** the catalog adds a visually hidden "Produse" `h2` above the product cards.
- **Heading order** on the routines and journal listings (visually hidden `h2`s) and **list
  structure** of the cart/checkout totals (the VAT note moved out of the `<dl>`).
- **axe-core** (WCAG 2.1 A/AA + best practices) on 27 pages — public pages, cart, checkout,
  account and admin forms, logged in where needed: 0 violations after the fixes.
- Mega menu: opens with Enter, Tab moves into the links, Escape closes it and returns focus to
  "Produse".
- Checked by script: skip link first in the tab order, visible focus ring on every stop (home,
  category, product), Escape closes and restores focus (search, cart, mobile menu), the quiz can be
  completed with the keyboard only, cart updates use an `aria-live` region, reduced-motion content
  is visible without scrolling animations.
