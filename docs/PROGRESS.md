# Progress

## Phase overview

| Phase | Scope                                                | Status  |
| ----- | ---------------------------------------------------- | ------- |
| 1     | Inspection, architecture, foundation                 | Done    |
| 2     | Design system and global layout                      | Done    |
| 3     | Catalog, product page, search                        | Done    |
| 4     | Cart and wishlist                                    | Done    |
| 5     | Accounts, authentication, consent, legal pages       | Done    |
| 6     | Recommendation engine, quiz, need discovery          | Done    |
| 7     | Routines and journal                                 | Done    |
| 8     | Homepage                                             | Done    |
| 9     | Checkout, orders, coupons                            | Done    |
| 10    | Reviews, newsletter, cookie consent, analytics       | Done    |
| 11    | Admin part 1 (dashboard, catalog, orders, customers) | Done    |
| 12    | Admin part 2 (quiz, content, marketing, settings)    | Done    |
| 13    | SEO, performance, security, accessibility audit      | Done    |
| 14    | Final UX review, tests, documentation                | Pending |

## Phase 1 — Foundation

- Next.js 16 app (TypeScript strict, ESLint, Prettier, Vitest), pnpm.
- Full Prisma schema (see `prisma/schema.prisma`) and `init` migration with CHECK constraints.
- Folder structure: `app`, `components/ui`, `components/layout`, `features`, `services`,
  `validation`, `lib`.
- `lib`: env validation, Prisma client, money (bani), Romanian text folding, slugs.
- `validation`: site settings registry, product attribute schemas.
- Idempotent seed: roles, 6 categories + 5 sample subcategories, 8 needs, 8 aroma
  profiles, 6 tags, 2 fictional brands, 16 demo products (oils, blends, kits,
  diffusers, accessories, care) with tags, needs, aromas, related products and kit contents.
- `.env.example`, README, CLAUDE.md (draft), this file and DECISIONS.md.

**Open items**

- Replace the draft CLAUDE.md with the owner's version if one exists.
- Real product data, images and official specs before launch (demo purge: delete rows
  where `isDemo = true`).

## Phase 2 — Design system and global layout

- Tokens in `src/app/globals.css` (`@theme`): colours (AA-checked), radii, shadows, spacing,
  easing, keyframes; Fraunces + Manrope via `next/font` with `latin-ext` (Romanian diacritics).
- UI primitives (`src/components/ui`): Button (8 variants, 5 sizes, loading, asChild), Input/Textarea/
  Field, Select, Checkbox, RadioCards, Badge, Card, Dialog, Drawer (left/right/bottom/full), Tabs,
  Accordion, Toast (imperative `toast()`), Skeleton, Spinner, RatingStars, Price, QuantitySelector,
  EmptyState.
- `<Logo />` driven by the `brand` SiteSetting (wordmark today, image later).
- Motion toolkit (`src/components/motion`): Reveal, Stagger, Parallax, HoverScale, PageTransition,
  BotanicalFloat, DrawLine — all honour `prefers-reduced-motion` via a hydration-safe hook.
- Botanical SVG motifs (Sprig, Leaf, Roots, Blossom) and SectionDivider.
- Image system: SmartImage (next/image + fade-in + fallback) and ProductImage with branded,
  product-type-aware placeholders.
- Header with DB-driven mega menu (Produse), Descoperă dropdown, search/account/wishlist/cart
  icons with counters; mobile slide-in menu, auto-hiding bottom nav, cart in the header.
- Footer with navigation, legal links, contact details and Facebook link from SiteSettings,
  newsletter slot (validates, explains it is not active yet, stores nothing).
- Global states: 404 (real 404 status), error boundary, global-error, loading templates, EmptyState.
- Placeholder pages for every linked route not built yet (no dead ends; noindex).
- `/styleguide` (noindex, not linked, disallowed in robots.txt).
- Home page first version (hero, entry points, categories).

**Open items**

- Legal review of required consumer links (ANPC SAL/SOL badges) before launch.
- Real logo: upload an image and set `brand.logo` to `{ kind: "image", … }`.
- Facebook URL: set `social.facebookUrl` in SiteSettings (hidden until set).

## Phase 3 — Catalogue, product page and search

- `/produse` and `/produse/[categorie]/[subcategorie]`, fully DB-driven (invalid paths 404).
- Filters generated from data (category, brand, price range, rating, availability, tags, needs,
  aroma profiles) with disjunctive counts; sorting (recomandate, cele mai noi, preț ↑/↓, rating);
  state in the URL (`?aroma=citric,floral&pret_min=40&sortare=noi&pagina=2`); active-filter chips;
  bottom drawer on mobile; crawlable pagination; filtered variants are noindex with canonical base.
- Product card (desktop hover → second image + quick actions; mobile compact + quick add),
  wishlist heart (UI only until Phase 4), quick-view modal.
- Product page `/produs/[slug]`: gallery (hover zoom, mobile swipe + dots, thumbnails), brand,
  rating, price/discount, stock, quantity, Adaugă în coș / Cumpără acum / favorite; sections
  Descriere (+ kit contents, ingredients), Profil aromatic, Cum poate fi integrat în rutină,
  Recomandări de utilizare, Siguranță, Rutine (empty state), Recenzii placeholder,
  Îți poate plăcea și (curated relations, then similarity). Product + BreadcrumbList JSON-LD.
- Search: pure engine (diacritic folding, synonyms incl. multi-word, prefix, typo tolerance,
  multi-field ranking), pluggable sources (products, categories, tags), 60 s in-memory index,
  `/api/search`, command palette (Ctrl/⌘+K or "/", grouped results, keyboard navigation,
  recent searches in localStorage, full-screen on mobile) and `/cautare` results page.
- Descoperă hub, `/descopera/nevoi`, `/descopera/categorii`; featured products on the home page.
- `sitemap.xml` (static pages, categories, products) referenced from robots.txt.
- Tests: listing (parse/serialise, filters, sorting, facets, pagination), similarity,
  search engine, stock labels, pagination window, Romanian plurals, recent searches.

## Phase 4 — Cart and wishlist

- Pure cart calculation (`services/cart/calculate.ts`): quantities clamped to stock and to 99 per
  line, unavailable/out-of-stock lines kept visible but excluded from totals, subtotal, discount
  hook (rules applied in order, clamped, rounded to the ban), shipping from SiteSettings (flat fee
  - free-shipping threshold on the subtotal after discounts), total, "mai adaugă X" amount.
- Server actions (Zod-validated) re-read prices and stock from the DB on every call; the client
  only sends product ids and quantities. Guest carts live in the DB behind an httpOnly `ar_cart`
  cookie (60 days); `mergeGuestCartIntoUser()` is ready for login.
- Cart drawer (opens after add-to-cart), animated header counter, free-shipping progress,
  line editing/removal with undo, gentle "Se potrivește bine cu produsul tău" suggestions
  (shared taxonomy scoring), `/cos` page with summary, coupon placeholder and suggestions.
- `/finalizare-comanda` placeholder (checkout phase) so no button dead-ends.
- Wishlist: localStorage store via `useSyncExternalStore` (hydration-safe, synced across tabs),
  heart on cards and product page, toasts with undo, `/favorite` page with "Mută în coș",
  designed empty state; `mergeLocalWishlistIntoUser()` ready for login.
- Verified end-to-end in Chromium: stock clamp + notice, drawer, counters, move to cart,
  persistence across reload, removal to empty state; no console errors.

**Open items for Phase 5 (auth)**

- Resolve the signed-in user in `features/cart/owner.ts` and call `mergeGuestCartIntoUser()`
  on login; call `mergeLocalWishlistIntoUser()` with the browser's ids and switch the wishlist
  provider to the DB for signed-in users.
- Cleanup job for expired guest carts (`carts.expiresAt`).

## Phase 5 — Accounts, authentication and consent

- Custom auth on the existing schema: argon2id password hashes, random session tokens stored
  hashed (`ar_session`, httpOnly, Secure in production, SameSite=Lax, 30-day sliding), single-use
  hashed tokens for email verification (24 h) and password reset (60 min, revokes all sessions).
- CSRF: all mutations are Server Actions (POST-only + Origin/Host check by Next) with SameSite
  cookies. Rate limiting (sliding window) on login (IP + email), registration, reset, verification
  resend and the contact form.
- Registration: first/last name, email, password + confirmation; required privacy consent and an
  optional, never pre-checked marketing consent. ConsentRecords store purpose, granted, timestamp,
  policy version, source and a salted IP hash; marketing consent creates a pending subscriber that
  activates on email verification.
- Roles/permissions (customer/editor/admin), `requireUser` / `requirePermission` guards in layouts,
  pages and actions, `/admin` returns 404 to non-staff; `proxy.ts` gives optimistic redirects that
  keep the requested path. First admin: `pnpm admin:create` (env vars).
- On sign-in: guest cart merged server-side; browser wishlist merged into the account and the
  wishlist switches to the DB for signed-in users.
- Email: provider abstraction (console in dev, Resend, SMTP); disabled — never faked — in
  production when unconfigured. Responsive HTML + text templates (verification, welcome, reset,
  contact) on a shared layout for later order/newsletter emails.
- `/cont`: sidebar (scrollable menu on mobile) with overview ("Salut, …", recent order, saved
  products, latest recommendation, saved routine, newsletter status — each with an empty state),
  Comenzi, Favorite, Rutinele mele, Rezultate quiz, Recomandări, Adrese (CRUD, Romanian counties,
  company invoicing), Date personale, Preferințe newsletter (withdraw/grant, personalisation toggle,
  consent history), Securitate (change password, devices, sign out others).
- Legal pages with real site facts and marked placeholders for lawyer review: confidențialitate,
  termeni, cookies (actual cookies/storage listed), retur, livrare; contact form (validated,
  rate-limited, honeypot, honest when email is unavailable).
- Tests: unit (hashing, tokens, rate limiter, permissions, consent reducer, auth/address schemas,
  email templates and provider resolution) and integration against PostgreSQL
  (`pnpm test:integration`: registration, login, sessions, verification, reset/change password,
  consent withdrawal, role guards, cart/wishlist merge).
- Verified in Chromium: register (validation, consent defaults), cart merge, verification link,
  addresses, consent withdrawal, customer 404 on /admin, logout → login with `next`, contact form,
  admin created by script can open /admin; no horizontal overflow at 390 px.

**Open items**

- Replace the in-memory rate limiter with a shared store (Redis/Upstash) if running more than one
  instance. Email change flow (with re-verification). Account deletion / data export requests
  (currently by email, per the privacy policy).

## Phase 6 — Recommendation engine, quiz and need discovery

- One pure, deterministic engine (`services/recommendation/engine.ts`): weighted signals (needs,
  aromas, tags, product types) from quiz answers, selected needs or — only with PERSONALIZATION
  consent — the customer's favourites/saved routines/purchases. Tie-breaks: featured → rating →
  review count → stock → name. Excludes inactive, out-of-stock, excluded and already-purchased
  products and anything without a positive match. Budget is a configurable penalty. Every result
  carries an explanation ("Recomandat pentru că ai ales: Relaxare + Seară + Floral.").
  `rankProfiles` is the hook for routines and articles (Phase 7).
- All question texts, answers and weights (incl. product-type and budget effects) are in the DB;
  engine multipliers are the `recommendation` SiteSetting. Seeded 8-question quiz.
- `/quiz`: intro, one question per screen, progress, animated direction-aware transitions (plain
  fade with reduced motion), back/skip, native radio/checkbox semantics, keys 1–9 + Enter,
  tap-to-advance for single choice, focus moved to each question, mobile-first layout.
- `/quiz/rezultat/[id]` "Descoperă ce ți se potrivește": primary recommendation with "De ce",
  secondary picks with reasons, add to cart/favorites. Results are saved for signed-in users;
  guests get an httpOnly `ar_quiz` id, can only see their own result and are invited to create an
  account — results are claimed on sign-in.
- `/descopera` "Ce cauți?" need picker and `/descopera/[nevoie]` using the same engine, with routine
  and article slots ready for Phase 7. `/cont/quiz` (history) and `/cont/recomandari` (latest quiz +
  "Pe baza favoritelor tale" with consent).
- Tests: engine (scoring, weights, ranking, tie-breaks, exclusions, budget, context, explanations,
  criteria builders), submission rules; integration (saving results with reasons, budget penalty,
  invalid answers, owner-only guest results + claim, consent-gated personal context).

## Phase 7 — Routines, journal and content connections

- Schema (`content_relations` migration): `Routine.frequency`, `Article.authorName`, routine tags,
  article ↔ routine and article tags. Routines carry cover, description, duration, difficulty,
  time of day, ordered steps (optionally linked to a product), products, needs, tags, related
  articles and SEO fields; articles carry cover, author, date, category, Markdown content, tags,
  related products/routines, SEO and published status.
- `/rutine` and `/rutine/[slug]`: steps timeline, product cards, related articles, HowTo JSON-LD.
  "Adaugă produsele rutinei în coș" adds each in-stock, active product once and reports what was
  skipped (out of stock / unavailable / already in cart) — pure `planRoutineCart`, server-side
  `addRoutineToCart`. Signed-in users save routines (`/cont/rutine`); guests are invited to sign in.
- `/jurnal`, `/jurnal/[categorie]`, `/jurnal/[slug]`: featured article, latest articles, category
  filter with counts, diacritic-insensitive journal search, reading time, related articles
  (category/routine/product/tag overlap), Article JSON-LD. Content is Markdown rendered without raw
  HTML; a line `{{produs:slug}}` or `{{rutina:slug}}` embeds a product or routine card.
- Connections: the product page shows real "Rutine care includ acest produs" and "Din jurnal";
  `/descopera/[nevoie]` ranks routines and articles with the shared engine (`rankProfiles`);
  search indexes routines and articles (keywords include their products, so "Lav" finds Lavender,
  the evening ritual and the lavender articles). Sitemap includes routines, categories, articles.
- Seed: 4 demo routines (Ritual de seară, Rutina de dimineață, Moment de concentrare, Atmosferă
  pentru casă), 7 journal categories, 5 demo articles — no medical claims, all flagged demo.
- Motion: `Reveal`/`Stagger` now show content immediately with reduced motion instead of waiting
  for the viewport.
- Tests: routine cart planning, article parsing/reading time/related ranking; integration
  (relationship queries, published-only listing and search, related articles, need ranking, saved
  routines, add-routine-to-cart skip reasons incl. guest cart, cross-type search).

## Phase 8 — Homepage

- Editorial hero "Ritualuri simple. Arome care îți transformă rutina." with "Descoperă produsele"
  and "Găsește ce ți se potrivește" (→ quiz). The heading is never animated (it is the LCP element,
  ~0.9 s locally); the rest rises in with a CSS animation that runs from first paint. An optional
  hero photo (`homepage.heroImage` setting) is rendered with `next/image` `priority` +
  `fetchPriority="high"`; without it, the illustrated botanical arch with parallax is shown.
- "Nu știi de unde să începi?": the shared need picker plus an "Începe quiz-ul" card.
- "Recomandat pentru tine" (signed-in only, right under the hero): latest quiz picks topped up with
  favourite-based suggestions (consent-gated), in stock only, each with its reason; otherwise an
  invitation to take the quiz.
- Popular categories (top-level, by product count), featured products (stagger), "Cele 5 esențiale"
  (editorial numbered list on forest green; slugs + aroma notes in the `homepage` setting, hidden if
  fewer than 3 resolve), featured routines, latest articles.
- Reviews: only real, APPROVED reviews rated ≥ 4 with a substantive text, shown as "Prenume I." with a
  verified-purchase mark; the section is hidden when there are none (nothing is invented).
- Newsletter block (premium card) — still the graceful placeholder form until Phase 10 wires double
  opt-in — and a Facebook community card only when `social.facebookUrl` is set (plain outbound
  link, no embedded or fabricated posts).
- Motion: reveal/stagger/parallax; all content visible with reduced motion. No horizontal overflow
  at 390 / 820 / 1280 px.
- `Price` gained `tone="inverse"` for dark sections; `listArticles` limits in SQL when not searching.
- Tests: essentials resolution, popular categories, personal row, reviewer name (unit); approved-only
  reviews, essentials threshold, quiz-based personal row skipping sold-out products (integration).

## Phase 9 — Checkout, orders and coupons

- Schema (`checkout_orders` migration): order status history (`OrderStatusEvent`), per-year order
  counter (human-friendly numbers `AR-2026-000123`), order snapshots (delivery method, coupon code,
  terms/privacy versions and acceptance time, product slug/image per item), coupon restrictions by
  product and category (categories include their subcategories).
- Settings: `shipping` now holds delivery methods (code, name, description, price, free-shipping
  eligibility, active) + the free-shipping threshold (old `{ flatFee }` values are upgraded on read);
  `payment` (cash on delivery; bank transfer offered only once IBAN and holder are filled in);
  `tax.vatRatePercent` (21, to confirm).
- One pricing path (`services/checkout/quote.ts` → pure `priceOrder`) for the cart, the checkout
  summary and order placement. Coupons: percentage (optional cap), fixed amount, free shipping;
  codes are case/space-insensitive; validity dates, total and per-customer limits (by account or
  email), minimum order value, product/category restrictions; clear Romanian reasons when a code
  does not apply. Applied in the cart and at checkout; a guest's code follows them on sign-in;
  attempts are rate-limited.
- `/finalizare-comanda`: signed-in customers with a verified email only (otherwise a resend-link
  state). Four steps — delivery details (saved or new address, save to account, same/other billing
  address incl. company data), delivery method, payment, review (note, required Terms & Privacy
  acceptance) — with a live summary, coupon field and "Plasează comanda cu obligație de plată".
  Validation uses the same Zod schemas on both sides; server field errors are shown on the fields.
- `placeOrder`: one transaction that locks the cart (double submits create one order) and the
  coupon (limits hold under concurrency), re-prices from the database, rejects stock issues,
  unavailable delivery/payment, invalid coupons and any difference from the total the customer saw,
  decrements stock with a conditional atomic update, snapshots items/addresses/prices, records the
  coupon use and the first status event, then empties the cart. Everything rolls back on failure.
- Payment provider interface with offline providers; no card payment is simulated. Stripe/Netopia
  integration steps in `docs/PAYMENTS.md`.
- Confirmation page "Comanda ta a fost înregistrată." with payment instructions; `/cont/comenzi`
  list and `/cont/comenzi/[numar]` detail (progress, items, totals, addresses, history). Order
  confirmation and status-update emails are sent only when an email provider is configured.
- `changeOrderStatus` (validated transitions, restock on cancellation before shipment, history,
  optional email) and `markOrderPaid` are ready for the admin (Phase 11).
- Tests: coupon rules, pricing/shipping/VAT, status transitions and numbering, payment methods,
  checkout schema (unit); order placement, verification requirement, tampered/stale totals, stock
  rollback, last-item race between two customers, double submit, foreign address, unavailable
  delivery/payment, coupon usage and per-customer/total limits, restricted coupons, guest coupon
  carry-over, order ownership, cancellation restock (integration).

## Phase 10 — Reviews, newsletter, cookie consent, analytics

- Storage abstraction (`src/lib/storage`): local disk (`./storage/uploads`, served by the
  `/uploads/[...key]` route with strict key validation) or S3-compatible (R2/S3/MinIO). Uploaded
  images are validated by their bytes (JPEG/PNG/WebP/AVIF; SVG/GIF refused), size-limited and
  re-encoded to WebP with sharp — EXIF orientation applied, all metadata (e.g. location) stripped,
  dimensions capped, decompression bombs refused. `next.config` whitelists the S3 public host.
- Reviews: only customers whose order with the product has shipped (or been delivered); one per
  product (a rejected one can be rewritten); rating 1–5, optional title, 20–2000 characters, optional
  photo. New reviews are PENDING; `moderateReview` approves/rejects (reason kept) and recomputes the
  cached `Product.rating/reviewCount` in the same transaction. Product page: average, count,
  distribution bars, approved reviews ("Prenume I.", verified-purchase mark, photo), eligibility
  messages and the form. No demo reviews are seeded (nothing invented).
- Newsletter: double opt-in (hashed, 48 h, single-use token; consent recorded only on
  confirmation), responses never reveal whether an address is subscribed, rate-limited. Without an
  email provider nothing is stored and the visitor is told honestly. Confirm and unsubscribe pages
  act on a button click (link scanners cannot confirm/cancel); signed (HMAC) unsubscribe links plus
  an RFC 8058 one-click endpoint (`List-Unsubscribe` headers on campaigns). Account preferences,
  unsubscribe links and guest confirmations stay in sync (same subscriber row + consent records).
  Segment-ready model (interests, source, customers, confirmation date), `NewsletterCampaign`,
  confirmation and campaign templates; `sendCampaign` refuses without a provider and only targets
  ACTIVE subscribers. Footer and homepage forms are live.
- Cookie consent: banner with "Accept toate" / "Doar necesare" as equally prominent buttons plus
  "Setări"; settings modal (necesare always on, analiză, marketing); choice stored in `ar_consent`
  (versioned with the cookie policy, re-asked after 12 months or a policy change) and recorded as
  ANALYTICS/MARKETING consent evidence; "Setări cookie" in the footer reopens it. Cookie policy page
  updated with every cookie and the analytics description.
- Analytics: provider-agnostic `track()` layer; nothing leaves the browser before consent (events
  are queued, then sent or dropped); first-party endpoint re-checks consent server-side, stores no IP,
  user agent or account id and strips personal-looking properties. Events: product_view, search,
  quiz_started, quiz_completed, add_to_cart, wishlist_add, checkout_started, order_completed.
- Personalisation: recently viewed products of signed-in customers are recorded only with
  PERSONALIZATION consent (deleted when withdrawn) and feed the engine's `viewedAffinity`.
- Tests: image sniffing/validation/keys, review eligibility and rating aggregation, unsubscribe
  signatures, segments, cookie-choice parsing/versioning, analytics event validation and client
  consent gating (unit); image re-encoding without metadata, verified-purchase reviews and
  moderation sync, photo upload, double opt-in, expired/single-use tokens, signed unsubscribe,
  account sync, campaign segmentation, server-side analytics gate, cookie consent records,
  consented product views (integration).

## Phase 11 — Admin, part 1

- Shell: `/admin` with a permission-filtered sidebar (mobile menu), skip link, sticky save bars.
  Three layers of authorisation: the layout (`admin:access`, non-staff get a 404), every page and
  action (`requirePermission` with the specific permission) and every service (`assertCan(actor, …)`).
  Editors see the catalogue; orders, customers (and later settings) need the admin role.
- Dashboard: 30-day sales per day (Bucharest days), KPIs with change vs the previous 30 days, average
  order, new accounts, subscribers, reviews to moderate, orders by status, best sellers, a consented
  analytics funnel, low stock, recent orders. Dependency-free SVG/CSS charts, each with a
  screen-reader table. Editors see the non-sales parts only.
- Products: list with search, status (active/inactive/low/out of stock) and type filters,
  pagination; create/edit every field (basics, Markdown texts, lei → bani prices, stock,
  type-specific specs, needs with relevance, aromas with intensity, tags, collections, visibility,
  SEO with counters); medical/therapeutic wording is refused by validation; unique slug/SKU errors on
  the field; delete only when never ordered and not in a kit (otherwise deactivate). Images:
  multi-upload through the storage layer (re-encoded WebP), reorder, choose the thumbnail, alt
  text, remove (files deleted when unused).
- Taxonomy CRUD in one config-driven editor: categories (tree, parent with cycle protection),
  brands, collections, tags, needs, aroma profiles (colour). Deletes are refused with an explanation
  when products, subcategories or quiz answers depend on the entry.
- Orders: list (search by number/email/name, status filter), detail with items, totals, addresses,
  note, history with the acting admin; status changes along allowed transitions (with note and an
  optional customer email when a provider is configured; cancellation returns stock) and "mark as
  paid".
- Customers: list with verification, newsletter status, order count and total spent; detail with
  account, current consents, orders, addresses, reviews, favourites and saved routines (read-only).
- Tests: admin nav/authorisation and `assertCan`, product and taxonomy validation, medical-claims
  guard, dashboard helpers (unit); service authorisation per role, product create/update with
  relations, slug clashes, image reorder/thumbnail/removal, delete rules, category cycles, order
  status/payment (integration).

## Phase 12 — Admin, part 2

- Sidebar groups: Conținut (routines, journal, quiz, reviews), Marketing (coupons, newsletter) and
  Configurare (settings). Content needs `content:edit` (editors); coupons need `orders:manage`,
  subscribers `users:manage` and settings `settings:manage` (admin only).
- Quiz manager (`/admin/quiz`): questions (text, help text, single/multiple choice, required,
  order) and answers with weights for needs, aroma profiles, tags and product types (−10…10, zero
  refused) plus an optional budget ceiling. Each answer shows how often customers chose it; answers
  and questions that appear in saved results cannot be deleted (edit them instead). A preview panel
  runs the real recommendation engine on any combination of answers (signals, budget, ranked
  products with score and explanation) without storing anything.
- Routines: CRUD with a step editor (add, reorder, remove, optional product per step), products
  (optional flag, note), needs, tags, cover image, time of day, difficulty, duration, SEO.
- Journal: CRUD with a Markdown editor (toolbar for headings, emphasis, lists, quotes, links and
  product/routine cards), live preview with the same renderer as the site, status and publication
  date (Bucharest days), category, tags, linked products/routines, cover and SEO. Cards that point at
  missing products or routines are refused on the content field. Drafts open on the site with
  `?previzualizare=1` for content editors only (banner, `noindex`).
- Reviews: moderation queue by status with photo, verified-purchase badge and rejection reason;
  approving/rejecting recomputes the product rating cache.
- Newsletter: subscribers with status, search, source, interest and "customers only" filters;
  CSV export of the current filter (UTF-8 BOM, formula-injection guard). Campaigns (draft, audience
  preview by segment, send) are available only when an email provider is configured.
- Coupons: CRUD (percentage with optional cap, fixed amount, free shipping; minimum subtotal,
  validity in whole Bucharest days, total and per-customer limits, product/category restrictions)
  with stats — uses, discount given and revenue of non-cancelled orders. Used coupons cannot be
  deleted (deactivate instead).
- Settings (`/admin/setari`): brand and logo upload, contact and social links, delivery methods and
  prices with the free-shipping threshold, payment texts and bank details, email sender name and
  reply-to, SEO defaults (title, template, description, social image upload), homepage, legal and
  VAT, recommendation weights. Every section is validated by the same schema used when reading.
  The root layout's metadata and every customer email now use these settings.
- Tests: coupon, content and quiz validation, Bucharest date helpers, CSV (unit); quiz weights
  changing the preview ranking, the delete guard for used answers, coupon code clashes, stats and
  delete guard, routine slug clashes, article embed checks, settings validation and permissions,
  subscriber CSV export (integration).

## Phase 13 — Audit

Full report with the change list and before/after Lighthouse scores: `docs/AUDIT.md`.

- SEO: shared metadata builder (canonical, robots, complete Open Graph and Twitter, fallbacks to
  the SEO settings and a default social image), editor `noIndex`/canonical honoured, Organization
  and WebSite JSON-LD on the homepage, absolute image URLs in Product/Article/HowTo JSON-LD, sitemap
  of indexable content only (plus legal pages), stricter robots.txt, brand favicon and touch icon.
- Fixed: newly published journal articles stayed hidden until a server restart.
- Performance: Fraunces without extra variation axes (−330 KB of preloaded fonts), Zod removed from
  client bundles (−85 KB gzip), LazyMotion. Mobile LCP 7.4 s → 4.5–5.1 s, mobile performance
  64–71 → 74–83, desktop 98–99.
- Security: nonce-based CSP, security headers (HSTS on HTTPS), sandboxed uploads, dependency
  advisories fixed with overrides (`pnpm audit` clean).
- Accessibility: focus returns after the cart drawer and search palette, busy buttons keep focus,
  quantity focus ring, logo label-in-name, catalogue heading order; Lighthouse accessibility 100 on
  the four audited pages.
- Tests: metadata builder, CSP/header builder (unit).
