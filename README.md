# Alchimia Rădăcinilor

Romanian online shop for essential oils, blends, kits, diffusers, accessories and
care products, with an aroma quiz, routines and a journal.

> Status: in development. The catalogue currently contains **demo data only**
> (flagged `isDemo`), with no official product specifications.

## Stack

Next.js 16 (App Router) · TypeScript (strict) · PostgreSQL 16 · Prisma 7 · Zod ·
Tailwind CSS 4 · Radix primitives · Motion · Vitest · ESLint + Prettier · pnpm

## Getting started

Requirements: Node.js ≥ 20.9, pnpm 10, PostgreSQL 16.

```bash
pnpm install                 # also runs `prisma generate`
cp .env.example .env         # then fill in DATABASE_URL (see comments in the file)
pnpm db:migrate              # apply migrations
pnpm db:seed                 # taxonomy + demo products (idempotent)
pnpm dev                     # http://localhost:3000
```

## First administrator

```bash
ADMIN_EMAIL=you@example.ro ADMIN_PASSWORD='a-long-password-2026' pnpm admin:create
```

Creates the account (email marked verified) or promotes an existing one. Re-run with only
`ADMIN_EMAIL` to grant the role to an existing account. The admin area is at `/admin`.

## Email

Set `EMAIL_PROVIDER` to `resend` (with `RESEND_API_KEY`) or `smtp` (with `SMTP_*`) and
`EMAIL_FROM`. In development the `console` provider prints emails (and their links) to the
terminal. In production an unconfigured provider disables sending — the site says so instead of
pretending an email was sent.

## Scripts

| Script            | What it does                                 |
| ----------------- | -------------------------------------------- |
| `pnpm dev`        | Development server                           |
| `pnpm build`      | Production build                             |
| `pnpm check`      | Typecheck, lint, format check and unit tests |
| `pnpm test`       | Unit tests (Vitest)                          |
| `pnpm db:migrate` | Create/apply a migration in development      |
| `pnpm db:deploy`  | Apply migrations in production               |
| `pnpm db:seed`    | Seed taxonomy and demo data                  |
| `pnpm db:reset`   | Drop, re-migrate and re-seed the database    |
| `pnpm db:studio`  | Prisma Studio                                |

## Project structure

```
prisma/               schema, migrations, seed
src/app/              routes (App Router)
src/features/         domain UI + server actions (catalog, cart, search, …)
src/services/         business logic and data access (server-only)
src/validation/       Zod schemas (inputs, settings, product attributes)
src/lib/              infrastructure (db, env, money, text, motion, …)
src/components/ui/    design-system primitives
src/components/layout header, footer, navigation
docs/                 PROGRESS.md, DECISIONS.md
```

See `CLAUDE.md` for architecture, content and design rules, and `docs/` for
progress and decisions.

## Site settings

Logo, contact details, social links and shipping fees are stored in the
`site_settings` table and validated by `src/validation/settings.ts`. Defaults are
seeded on first run and are never overwritten by later seeds.
