# Decisions

Architecture decision log. Newest entries at the bottom of each phase. Each entry:
context → decision → consequences.

## Phase 1 — Foundation

### D-001 · No CLAUDE.md existed; phases confirmed implicitly

The repository was empty and had no CLAUDE.md. The user moved on to Phase 2–4
prompts without answering the Phase 1 questions, which was taken as confirmation
of the proposed defaults (D-003, D-004, D-010). A draft CLAUDE.md was written from
the Phase 1 plan; replace or merge it with the owner's version when available.

### D-002 · Stack

Next.js 16 (App Router) + TypeScript strict (`noUncheckedIndexedAccess`) +
PostgreSQL 16 + Prisma 7.10 + Zod 4 + Tailwind 4 + Radix + Motion + Vitest.
npm's `prisma@latest` tag pointed at an 8.0 release candidate, so the stable 7.10
is pinned. ESLint stays on 9 because `eslint-config-next` 16 targets it.

Prisma 7 specifics: `prisma.config.ts` holds the datasource URL (loaded with
`dotenv`), the client is generated to `src/generated/prisma` (git-ignored,
regenerated on `postinstall`), and it connects through `@prisma/adapter-pg`.

### D-003 · One SKU per product (no variants)

Product carries its own SKU, price and stock as specified. If the same oil is later
sold in several sizes, add a `ProductVariant` table and point cart/order/wishlist
items at it — ideally before real orders exist.

### D-004 · Better Auth tables in the first schema

`User`, `Session`, `Account`, `Verification` follow Better Auth's schema so the auth
phase needs no reshaping of `User`. Roles are a `Role` table + `UserRole` join;
permissions are mapped from role keys in code.

### D-005 · Money in integer bani

All amounts are `Int` minor units. `formatMoney` formats at the edge; `toMinor`
converts user input via exponent shifting to avoid float drift (1.005 → 101).

### D-006 · Derived values are not stored

- **discount** = `compareAtPrice − price` (computed by the pricing service).
- **thumbnail** = `ProductImage` at `position = 0` (`@@unique([productId, position])`).
- **category / subcategory**: a product points at its most specific category; the
  top-level category is read from the tree, so the two can never disagree.

Exception: `Product.rating` and `Product.reviewCount` are cached aggregates (needed
for sorting/filtering listings) that the review service must recompute when a
review is approved/rejected/removed.

### D-007 · Shared `SeoMeta` and `MediaAsset` tables

SEO fields live in one `SeoMeta` table referenced 1:1 by Product, Category, Brand,
Collection, Routine, Article and ArticleCategory — adding an SEO field is one change.
Every uploaded file is a `MediaAsset`, referenced by product images, logos, covers
and OG images.

### D-008 · `Product.attributes` JSON for type-specific specs

Per-type details (volume, diffuser capacity…) go in a JSON column validated by a
Zod schema per `productType` (`src/validation/product.ts`). A field that needs
filtering or sorting gets promoted to a real column.

### D-009 · Quiz scoring beyond tags

Besides `QuizAnswerTag` (weighted, weights may be negative), answers can score
needs and aroma profiles directly via `QuizAnswerNeed` / `QuizAnswerAromaProfile`,
so these taxonomies are not duplicated as tags.

### D-010 · Demo data

Fictional brands ("Botanica Demo", "Atelierul Demo") and demo products are flagged
`isDemo`. No official specs (volumes, compositions, certifications) are invented;
`attributes` is left empty and usage/safety text is an explicit placeholder. Sample
subcategories (Citrice, Frunze și ierburi, Flori, Flacoane și roll-on, Călătorie)
exist to exercise the category tree.

### D-011 · Snapshots on orders

`OrderItem` and `OrderAddress` copy name, SKU, price and address at purchase time.
This is the legal record of the sale, not duplicated catalogue data.

### D-012 · Database CHECK constraints in migration SQL

Prices ≥ 0, `compareAtPrice > price`, stock ≥ 0, ratings 1–5, quantities > 0,
coupon percentages 1–100, no self-referencing kits/relations/categories. Prisma's
schema cannot express these, so they are appended to the init migration.

### D-013 · Site settings as validated key/value

`SiteSetting(key, value Json)` with a Zod registry in `src/validation/settings.ts`.
New settings need no migration; invalid stored JSON falls back to defaults.

## Phase 2 — Design system and layout

### D-014 · Semantic tokens, AA-checked

Colour tokens are semantic (`paper`, `ink`, `forest`, `clay`…). Every text/background pair used
for text was checked for WCAG AA; `sage` and `ochre` are decorative only (ochre ≥ 3:1 for stars).

### D-015 · Radix primitives + CSS animations for overlays; Motion for scroll/ambient

Dialogs, drawers, menus, tabs and accordions use Radix (focus management, ARIA) animated with
CSS keyframes via `data-state`, which the global reduced-motion rule neutralises. Motion is used
for scroll reveals, stagger, parallax and ambient botanical elements. Motion's own
`useReducedMotion` reads `matchMedia` during the first client render (hydration mismatch), so a
`useSyncExternalStore`-based `usePrefersReducedMotion` is used and elements are never swapped.

### D-016 · Storefront renders dynamically for now

`(site)/layout.tsx` sets `dynamic = "force-dynamic"`: stock and prices are always fresh and builds
do not need a database. Caching (Cache Components / tags) is revisited in the performance phase.

### D-017 · No section-wide `loading.tsx`

A loading boundary makes the response stream, and a streamed `notFound()` can only answer
200 + noindex. Routes that can 404 (categories, products) therefore have no `loading.tsx` above
them; they use in-page `<Suspense>` after their `notFound()` checks, keeping real 404 statuses.

### D-018 · Route group `(site)` for the storefront chrome

Header/footer live in `(site)/layout.tsx`; the root `not-found.tsx` renders the same `SiteChrome`
for unmatched URLs. A future admin area can get its own layout without the storefront chrome.

### D-019 · Placeholder pages instead of dead links

Every navigation target that a later phase builds exists now as a noindex "în pregătire" page with
useful next steps. Category URLs are validated against the tree (invalid ones 404).

### D-020 · Pure modules separate from data access

Pure logic (e.g. `category-tree.ts`) lives in its own module with tests; data-access modules
(`categories.ts`) import `server-only` and the DB client. Client components import only pure modules.

## Phase 3 — Catalogue and search

### D-021 · Listing logic in memory over light rows

A listing loads light rows for its scope (id, price, rating, stock, taxonomy slugs) in one query;
filtering, sorting, disjunctive facet counts and pagination run in a pure, tested module
(`services/catalog/listing.ts`); only the current page's cards are then fetched. This keeps facet
counts consistent with results and the logic fully testable. It suits a boutique catalogue (up to
a few thousand products). Scaling path: move filters to SQL `where` + `groupBy` facet queries
behind the same `CatalogFilters` interface.

### D-022 · Search as an in-memory index with pluggable sources

The engine is pure (`services/search/engine.ts`); sources (`services/search/sources/*`) return
`SearchDocument`s and are registered in `services/search/index.ts`. The index is rebuilt at most
every 60 s. Synonyms are expanded at index time so multi-word pairs work. Scaling path: Postgres
full-text search with `unaccent`, or a hosted search service, behind the same API.

### D-023 · Romanian URL parameters, noindex for filtered variants

Filter params are Romanian (`categorie`, `nevoie`, `aroma`, `eticheta`, `brand`, `pret_min`,
`pret_max`, `rating`, `stoc`, `sortare`, `pagina`), multi-values comma-separated and sorted for
stable URLs. Filtered/sorted pages are `noindex, follow` with a canonical to the base listing.

### D-024 · Markdown for editorial fields

Descriptions, usage and safety text are Markdown rendered with `react-markdown` (raw HTML
skipped), so editors can format text without HTML injection risk.

### D-025 · Related products: curated first, then similarity

`ProductRelation` rows come first; remaining slots are filled by a similarity score over shared
needs (×3), aroma profiles (×2), tags (×1) and category (×1), excluding out-of-stock items. The same
scorer powers cart suggestions.

### D-026 · `typecheck` runs `next typegen` first

Route-aware types (`PageProps<"/produs/[slug]">`) are generated by Next; the script runs
`next typegen && tsc --noEmit` so it works on a clean checkout.

## Phase 4 — Cart and wishlist

### D-027 · Guest carts in the database behind a cookie token

Guest carts are rows in `carts` identified by an opaque, random, httpOnly cookie token rather
than client-side storage. Totals are always computed on the server from current prices and
stock, the cart survives reloads and devices sharing the cookie, and merging on login is a
single transaction. Expired guest carts (60 days) need a periodic cleanup.

### D-028 · Cart loads client-side through a server action

The provider fetches the cart on mount instead of reading cookies in the layout, so pages keep
no per-user data in their HTML (ready for caching later). The header counter appears after load.

### D-029 · Stock is enforced at write time and re-checked at read time

Adding clamps the stored quantity to stock (with a notice). If stock drops later, reads flag the
line (`quantity-reduced`, `out-of-stock`, `unavailable`) and totals use the purchasable quantity.
Final reservation/decrement belongs to checkout.

### D-030 · Free-shipping threshold uses the subtotal after discounts

This prevents a discount code from pushing an order below the threshold while still shipping for
free. A free-shipping coupon is modelled as a discount rule with `freeShipping: true`.

### D-031 · Guest wishlist in localStorage

Wishlists are low-stakes and need no server round-trip for guests, so they live in the browser
(ids only). Signed-in users get the `wishlists` table; the merge function is pure and tested.

## Phase 5 — Accounts and consent

### D-032 · Custom authentication instead of Better Auth (supersedes D-004)

Requirements (split names, two consents with records, verification before ordering, cart and
wishlist merge, Romanian copy, precise rate limits) touch every step of the flow. A small custom
layer on the existing tables (`sessions`, `accounts`, `verifications`) is fully testable and has no
framework coupling. `User.name` became `firstName`/`lastName`; `emailVerified` became
`emailVerifiedAt`.

### D-033 · Session and token storage

Session cookies carry a random 256-bit token; only its SHA-256 hash is stored, so a database leak
does not yield usable sessions. One-time tokens are hashed too and are single-use; issuing a new
one invalidates the previous link. Email verification requires a click (POST) so link scanners
cannot consume the token.

### D-034 · CSRF protection

Every state change is a Server Action: Next.js only accepts POST for actions and rejects requests
whose Origin does not match the Host. Auth cookies are SameSite=Lax and httpOnly. The only route
handler (`/api/search`) is a read-only GET.

### D-035 · Rate limiting in memory

Sliding-window limiters per process (`services/auth/rate-limit.ts`). Adequate for a single
instance; swap the store for Redis/Upstash behind the same interface when scaling out. Limits count
only requests that pass validation for registration, so fixing typos never locks a user out.

### D-036 · Email is never faked

`sendEmail` returns `sent | logged | disabled | failed`. The console provider is refused in
production; half-configured providers are reported as disabled. Actions surface delivery problems
honestly (e.g. registration says the confirmation email could not be sent).

### D-037 · Consent purposes

`PRIVACY_POLICY` (required at sign-up), `NEWSLETTER` (the optional email-marketing checkbox) and
`PERSONALIZATION` (using account activity for recommendations, off by default). Records are
append-only; the current state is the latest record per purpose. The newsletter subscriber row
mirrors the NEWSLETTER consent and becomes active when the email is verified.

### D-038 · Guards at three levels

`proxy.ts` does an optimistic cookie-presence redirect (keeps the requested path); layouts and
pages call `requireUser`/`requirePermission`; every action calls them again. Non-staff get a 404
for `/admin` so the area is not advertised.

### D-039 · Integration tests on a real database

`pnpm test:integration` migrates `DATABASE_URL_TEST`, truncates tables between tests and exercises
services against PostgreSQL (constraints, transactions and unique indexes are part of the logic).

## Phase 6 — Recommendations and quiz

### D-040 · A single rule-based engine

Quiz, need pages, account recommendations and (later) homepage/routines/articles all call
`recommendProducts` / `rankProfiles`. Scores are sums of weight × engine multiplier × product
relevance (aroma intensity normalised to 3). No randomness; explanations are generated from the
largest positive contributions, so the customer always sees why.

### D-041 · Weights in data, multipliers in settings

Answer → need/aroma/tag/product-type weights (negative allowed) and budget ceilings live in quiz
tables; the engine's global multipliers and budget penalty are the `recommendation` SiteSetting.
Changing either changes results without code changes (admin UI in Phase 12).

### D-042 · Budget as a penalty, not a filter

A product above the chosen budget loses `budgetPenalty` points (default 12), so exact matches
within budget win while a strong match slightly above budget can still appear if nothing else fits.

### D-043 · Guest quiz results

Guests' results are stored with a random httpOnly `ar_quiz` id; only that browser (or the account
after sign-in) can open them. Results store a snapshot of rank, score and reason.

### D-044 · Personal context only with consent

Wishlist, saved-routine and purchase signals are loaded only when the latest PERSONALIZATION
consent is granted. Purchased products are excluded ("already owned").

## Phase 7 — Routines and journal

### D-045 · Article content is Markdown with line embeds

Articles are stored as Markdown and rendered with react-markdown without raw HTML (no XSS surface).
A paragraph consisting only of `{{produs:slug}}` or `{{rutina:slug}}` becomes a live product or
routine card; unknown or unpublished slugs are silently dropped. The admin editor (Phase 12) will
write the same format.

### D-046 · One dynamic segment under /jurnal

`/jurnal/[slug]` resolves a journal category first, then an article, so both `/jurnal/uleiuri` and
`/jurnal/<article>` stay short. Category and article slugs must not collide: the seed respects this and
the admin forms (Phase 12) must reject a clash.

### D-047 · Routine → cart adds one of each available product

The button adds quantity 1 of every active, in-stock product not already in the cart and never
changes quantities the customer already chose. Skipped products are named with the reason. Stock
and prices are re-read on the server.

### D-048 · Routines and articles share the recommendation engine

Need pages rank routines and articles with `rankProfiles` using the same weights as products, so
one tuning surface (the `recommendation` setting) affects all content.

## Phase 8 — Homepage

### D-049 · The hero heading is the LCP and is never hidden

Scroll reveals start at opacity 0 and wait for hydration, which would delay Largest Contentful
Paint. The hero heading is therefore static; supporting text uses a CSS-only entrance that starts
at first paint (`animate-rise`, disabled with reduced motion). A hero photo, when configured, is
the LCP instead and is requested with high priority.

### D-050 · Editorial homepage content lives in a setting

The hero photo and "Cele 5 esențiale" (product slugs + short aroma notes) are the `homepage`
SiteSetting, editable later from admin settings (Phase 12). Everything else on the homepage is
derived from the catalogue and content (featured flags, product counts, publish dates).

### D-051 · Social proof is real or absent

The homepage shows only approved reviews from customers, with first name + last initial; there
are no written testimonials and no embedded social feed. Sections without data are hidden rather
than filled with placeholders.

## Phase 9 — Checkout, orders and coupons

### D-052 · One pricing path, and the customer's total is a precondition

The cart, the checkout summary and `placeOrder` all price through `buildQuote` → `priceOrder`. The
client never sends prices; it sends the total it displayed, and the order is refused (with fresh
totals) when the server's total differs. No silent price changes.

### D-053 · Stock is decremented with a conditional update inside the order transaction

`UPDATE … SET stock = stock - q WHERE stock >= q AND active` per line; any line that fails aborts
the whole transaction. Concurrent buyers of the last item get exactly one order. The cart row is
locked first so a double submit produces one order; the coupon row is locked so usage limits hold.

### D-054 · Order numbers from a per-year counter table

`AR-<year>-<6 digits>` from `order_counters`, incremented inside the order transaction (no gaps
from rolled-back orders; the year follows Europe/Bucharest). A counter table is used instead of a
Postgres sequence because Prisma migrations manage it like any other table.

### D-055 · Delivery methods and payment options are settings, not tables

They are few, edited rarely and snapshotted on every order (`shippingMethodCode/Name`,
`paymentMethod`), so a SiteSetting is enough. Bank transfer is offered only when the account
details exist; card payments require a real provider (docs/PAYMENTS.md).

### D-056 · Coupons: restrictions narrow the discount base, minimum applies to the whole cart

Percentage and fixed discounts apply to eligible lines only (restricted by product or category,
categories including descendants), while "comandă minimă" is checked against the whole cart
subtotal. The per-customer limit counts past uses by account or order email. A free-shipping code
only applies to delivery methods marked eligible.

### D-057 · Checkout requires a verified account

Guests can build a cart and apply codes, but placing an order needs a signed-in customer with a
verified email (order history, confirmations, GDPR requests all hang off the account). The guest
cart and its code are merged on sign-in.

## Phase 10 — Reviews, newsletter, consent, analytics

### D-058 · Uploaded images are always re-encoded

Customer and admin uploads are sniffed by magic bytes, then re-encoded to WebP by sharp. This
removes metadata (camera, GPS), neutralises polyglot files and normalises size. Keys are random and
never derived from file names. Local files are served by a route handler (Next only serves `public/`
files present at build time); serverless deployments must use S3.

### D-059 · Reviews require a shipped purchase and moderation

Only customers with a shipped/delivered order of the product can review; every review is moderated
before publication. `Product.rating/reviewCount` are a cache recomputed from approved reviews in the
moderation transaction. The homepage and product page never show invented testimonials.

### D-060 · Double opt-in without leaking membership

A subscription request always answers the same way; the confirmation email proves ownership and is
the moment consent is recorded. A verified account email subscribing itself needs no second
confirmation. Confirm/unsubscribe links require a click on the page (scanner-safe); mail clients use
the signed one-click POST endpoint.

### D-061 · First-party, consent-gated analytics

No third-party analytics script is loaded. Events go to our own endpoint only after the visitor
accepts analytics cookies, are checked again on the server against the consent cookie, and are
stored with a random id that is not linked to the account. Adding a third-party provider means
registering it in `lib/analytics/client.ts` and loading its script only after consent.

### D-062 · Cookie choice versioned by the cookie policy

The choice cookie carries the cookie-policy version; a new version (or 12 months) shows the banner
again. Every choice is recorded as ANALYTICS/MARKETING consent records (with the account when signed
in) for accountability.

## Phase 11 — Admin

### D-063 · Services take an actor and re-check permissions

Admin services receive `{ id, roles }` and call `assertCan` themselves, even though pages and
actions already call `requirePermission`. A future route (API, script, another action) cannot skip
the check by forgetting it, and the rules are covered by integration tests without HTTP.

### D-064 · Copy is checked for medical claims at write time

Product, taxonomy and (next phase) content validation refuse common Romanian therapeutic wording
(`lib/claims.ts`). It is a guard rail for the CLAUDE.md rule, not a substitute for editorial review.

### D-065 · Deactivate instead of delete for anything with history

Products that appear in orders or kits, categories with products or children, brands with products
and needs/aromas used by the quiz cannot be deleted; the error says what to do instead. Orders keep
their snapshots regardless.

### D-066 · Charts without a chart library

The dashboard needs a handful of bar/column charts. Small SVG/CSS components (with data tables for
screen readers) avoid a large client bundle and render on the server.
