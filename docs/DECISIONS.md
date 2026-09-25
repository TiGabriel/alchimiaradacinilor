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
