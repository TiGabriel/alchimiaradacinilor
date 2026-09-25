@AGENTS.md

# Alchimia Rădăcinilor — project guide

> **Draft.** This file was created by Claude because no CLAUDE.md existed in the
> repository. If you have your own version, replace or merge it — the rules and
> phase checklist below are Claude's proposal from Phase 1.

Romanian e-commerce site for essential oils, blends, kits, diffusers, accessories
and care products, with an aroma quiz, routines and a journal (blog).

## Stack

Next.js 16 (App Router, React 19, Turbopack) · TypeScript strict · PostgreSQL 16 ·
Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`) · Zod 4 · Tailwind CSS 4 ·
Radix primitives (`radix-ui`) · Motion · Vitest · ESLint 9 + Prettier · pnpm.

Next.js 16 differs from older versions: read `node_modules/next/dist/docs/` before
using an API you are unsure about (async `params`/`searchParams`/`cookies()`,
`proxy.ts` instead of `middleware.ts`, `revalidateTag(tag, profile)`, …).

## Commands

```bash
pnpm dev            # dev server
pnpm check          # typecheck + lint + format check + tests
pnpm test           # unit tests (vitest)
pnpm test:integration  # integration tests against DATABASE_URL_TEST
pnpm admin:create   # create/promote an admin (ADMIN_EMAIL, ADMIN_PASSWORD)
pnpm build          # production build
pnpm db:migrate     # create/apply a migration (dev)
pnpm db:seed        # idempotent seed (taxonomy + demo products)
pnpm db:reset       # drop, migrate, seed
```

## Architecture rules

```
app/            routes only: compose features, read params, set metadata. No business logic.
features/<x>/   UI + server actions for one domain (catalog, cart, search, …).
services/       business logic + data access. Server-only. No React/Next UI imports.
validation/     Zod schemas shared by forms, server actions, route handlers, settings.
lib/            infrastructure: db, env, money, text, slug, seo, motion, storage, email.
components/ui/  presentational primitives. Never fetch data.
components/layout/  header, footer, navigation shells.
```

- `app` and `features` never call Prisma directly — go through `services`.
- Every external input (form, action, route handler, search param) is parsed with Zod.
- Pure logic (pricing, cart totals, filtering, search matching, quiz scoring) lives in
  pure functions with unit tests next to them (`*.test.ts`).
- Server Components by default; `"use client"` only where interaction needs it.
- Never trust client prices or totals — recompute on the server.
- Keep pure logic in modules that do not import `@/lib/db` (tests and client components
  import them); data access lives next to it in a `server-only` module.
- No `loading.tsx` above routes that call `notFound()` (see DECISIONS D-017).
- Every mutation is a Server Action that calls `requireUser()`/`requirePermission()` itself
  (layouts are not enough) and validates input with Zod.
- Never report success for an email that was not sent (`isDelivered()`).

## Data rules

- Money is **integer minor units (bani)**. Format only at the edge with `formatMoney`.
- Derived values are computed, not stored: discount, thumbnail (image at position 0),
  category/subcategory (from the tree). Exceptions are documented caches
  (`Product.rating`, `Product.reviewCount`).
- Orders snapshot names, prices and addresses (legal record).
- New site settings: add a key to `src/validation/settings.ts` (no migration).
- Demo data is flagged `isDemo`. Never invent official specs (volumes, compositions,
  certifications) for real products.

## Content rules

- UI copy is **Romanian**, with correct diacritics (ă â î ș ț — comma-below, not cedilla).
- **No medical or therapeutic claims.** Do not say a product treats, cures, heals,
  prevents or relieves any condition. Describe aroma, atmosphere, ritual and
  moments of the day instead ("aromă florală pentru serile liniștite", not
  "ajută la insomnie").
- Tone: calm, warm, botanical, premium, never pushy (no aggressive upselling).

## Design direction

Botanical apothecary: warm paper backgrounds, deep forest green, sage, clay and
ochre accents; an elegant serif for display text and a clean sans for UI. Generous
whitespace, soft shadows, subtle botanical line motifs used sparingly.

Tokens live in `src/app/globals.css` (`@theme`). Use tokens, not raw hex values.

| Token        | Use                                 |
| ------------ | ----------------------------------- |
| `paper`      | page background                     |
| `paper-deep` | alternating sections                |
| `surface`    | cards, popovers                     |
| `ink`        | body text                           |
| `ink-muted`  | secondary text                      |
| `line`       | borders, dividers                   |
| `forest`     | primary actions, brand              |
| `sage`       | soft accents, selected states       |
| `clay`       | discounts, highlights (AA on white) |
| `ochre`      | rating stars, small ornaments       |

Fonts: Fraunces (display) and Manrope (UI/body), loaded with `next/font` using the
`latin-ext` subset for Romanian diacritics.

Motion: use `src/lib/motion` / `components/motion`. Every animation must respect
`prefers-reduced-motion` (content must be visible and usable with motion off).

Accessibility: keyboard reachable, visible focus rings, labelled controls,
AA contrast, `aria-live` for cart/toast updates.

## Phase checklist (run at the end of every phase)

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm test` and `pnpm test:integration` pass; new logic has tests
- [ ] `pnpm build` passes
- [ ] Migrations committed; `pnpm db:seed` runs cleanly (idempotent)
- [ ] Copy is Romanian, diacritics correct, no medical/therapeutic claims
- [ ] Mobile and desktop layouts checked; no broken links or dead-end UX
- [ ] Keyboard/focus/labels checked; `prefers-reduced-motion` respected
- [ ] No secrets committed; new env vars documented in `.env.example`
- [ ] `docs/PROGRESS.md` and `docs/DECISIONS.md` updated
