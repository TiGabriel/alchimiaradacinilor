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
