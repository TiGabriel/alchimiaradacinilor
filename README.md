# Alchimia Rădăcinilor

Romanian online shop for essential oils, blends, kits, diffusers, accessories and care products —
with an aroma quiz, step-by-step routines, a journal, verified-purchase reviews, a double opt-in
newsletter and a full admin.

> The catalogue ships with **demo data only** (flagged `isDemo`, marked "Demo" on the site). No
> official product specifications are invented; see [Before launch](#before-launch).

- **Shop:** catalogue with filters and facets, product pages (aroma profile, moments, usage and
  safety sections), instant search, wishlist, cart with coupons, checkout (cash on delivery, bank
  transfer), order history.
- **Discovery:** aroma quiz with explained recommendations, discovery by need and category,
  routines (add a whole routine to the cart), journal with product/routine cards.
- **Accounts:** registration with email verification, password reset, addresses, preferences,
  saved routines, consent management, newsletter preferences.
- **Admin (`/admin`):** dashboard, products (images, SEO), taxonomy, orders, customers, quiz
  editor with a live preview, routines, journal, review moderation, newsletter (segments, CSV,
  campaigns), coupons with stats, site settings.
- **Compliance:** cookie consent before any analytics, first-party analytics only, no medical or
  therapeutic claims (validated in the admin), legal pages with placeholders for the owner.

## Contents

- [Tech stack](#tech-stack)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Database, migrations and seed](#database-migrations-and-seed)
- [First administrator](#first-administrator)
- [Image storage](#image-storage)
- [Email](#email)
- [Payments](#payments)
- [Production deployment (Vercel + Postgres + S3)](#production-deployment-vercel--postgres--s3)
- [Domain: alchimiaradacinilor.ro at hostgate.ro](#domain-alchimiaradacinilorro-at-hostgatero)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Before launch](#before-launch)

## Tech stack

| Area       | Choice                                                                        |
| ---------- | ----------------------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, React 19, Turbopack, `proxy.ts`)                      |
| Language   | TypeScript (strict)                                                           |
| Database   | PostgreSQL 16 with Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`) |
| Validation | Zod 4 — every form, action, route and setting                                 |
| UI         | Tailwind CSS 4 (design tokens in `src/app/globals.css`), Radix primitives     |
| Motion     | Motion (`framer-motion`, `LazyMotion`), respects `prefers-reduced-motion`     |
| Images     | `sharp` (validation + WebP re-encoding), local disk or S3-compatible storage  |
| Email      | Console (dev), Resend or SMTP (`nodemailer`)                                  |
| Tests      | Vitest (unit) + Vitest against a real Postgres (integration)                  |
| Tooling    | pnpm 10, ESLint 9, Prettier                                                   |

Architecture, content and design rules: [`CLAUDE.md`](CLAUDE.md). Decisions and their reasons:
[`docs/DECISIONS.md`](docs/DECISIONS.md). Audit results: [`docs/AUDIT.md`](docs/AUDIT.md).
Payments: [`docs/PAYMENTS.md`](docs/PAYMENTS.md). Final status: [`docs/FINAL-REPORT.md`](docs/FINAL-REPORT.md).

## Local development

Requirements: **Node.js ≥ 20.9** (22 LTS recommended), **pnpm 10**, **PostgreSQL 16**.

```bash
# 1. Dependencies (also runs `prisma generate`)
pnpm install

# 2. Environment
cp .env.example .env
#    set DATABASE_URL (and DATABASE_URL_TEST for integration tests)

# 3. Database
createdb alchimia                # or use Docker, see below
pnpm db:migrate                  # apply migrations
pnpm db:seed                     # taxonomy, quiz, settings + demo catalogue (idempotent)

# 4. An admin account
ADMIN_EMAIL=you@example.ro ADMIN_PASSWORD='a-long-password-2026' pnpm admin:create

# 5. Run
pnpm dev                         # http://localhost:3000 (admin at /admin)
```

A throwaway Postgres with Docker:

```bash
docker run -d --name alchimia-db -p 5432:5432 \
  -e POSTGRES_USER=alchimia -e POSTGRES_PASSWORD=alchimia -e POSTGRES_DB=alchimia postgres:16
docker exec alchimia-db createdb -U alchimia alchimia_test   # for integration tests
```

In development, emails are printed to the terminal (`EMAIL_PROVIDER=console`), including the
verification and password-reset links — so you can register and verify an account without an
email provider.

## Environment variables

Every variable is documented in [`.env.example`](.env.example); server variables are validated
at start-up by `src/lib/env.ts`.

| Variable                                                                                             | Required                | Purpose                                                                          |
| ---------------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------- |
| `DATABASE_URL`                                                                                       | yes                     | Postgres connection string                                                       |
| `APP_URL`                                                                                            | yes in production       | Public base URL (canonical URLs, sitemap, emails, HSTS/CSP upgrade when `https`) |
| `AUTH_SECRET`                                                                                        | yes in production       | ≥ 32 random characters; signs unsubscribe links, salts IP pseudonyms             |
| `EMAIL_PROVIDER`, `EMAIL_FROM`                                                                       | for email               | `console` \| `resend` \| `smtp`, and the sender address                          |
| `RESEND_API_KEY` or `SMTP_*`                                                                         | with that provider      | Provider credentials                                                             |
| `STORAGE_DRIVER`                                                                                     | —                       | `local` (default) or `s3`                                                        |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | with `s3`               | Bucket and its public URL                                                        |
| `DATABASE_URL_TEST`                                                                                  | for integration tests   | A separate database (it is truncated by the tests)                               |
| `ADMIN_*`                                                                                            | for `pnpm admin:create` | First administrator                                                              |
| `SEED_DEMO`                                                                                          | —                       | `false` seeds without demo products, routines and articles                       |

Business settings (shipping methods and prices, free-shipping threshold, payment texts and bank
details, sender name, SEO defaults, logo, contact, social links, legal versions, VAT) are **not**
environment variables: they live in the database and are edited in **Admin → Setări**.

## Database, migrations and seed

- Schema: `prisma/schema.prisma`; migrations: `prisma/migrations/` (committed).
- `pnpm db:migrate` — create/apply migrations in development (`prisma migrate dev`).
- `pnpm db:deploy` — apply committed migrations in production (`prisma migrate deploy`).
- `pnpm db:seed` — idempotent: roles, categories, needs, aroma profiles, tags, the quiz, journal
  categories and default settings (settings are never overwritten), plus the demo catalogue.
  `SEED_DEMO=false pnpm db:seed` skips the demo brands, products, routines and articles.
- `pnpm db:reset` — drop, re-migrate and re-seed (development only).
- Removing demo data later: delete rows where `isDemo = true` (products, brands, routines,
  articles) — orders keep their own snapshots.

## First administrator

```bash
ADMIN_EMAIL=you@example.ro ADMIN_PASSWORD='a-long-password-2026' pnpm admin:create
```

Creates the account (email marked verified) or promotes an existing one; with only `ADMIN_EMAIL`
it grants the role to an existing account. Optional: `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME`.
Roles: `customer`, `editor` (catalogue and content), `admin` (everything, including orders,
customers and settings). Non-staff visitors get a 404 on `/admin`.

## Image storage

Uploads (product photos, covers, review photos, logo, social images) are validated by their
bytes, resized and re-encoded to WebP without metadata.

- **`local`** (default): files go to `./storage/uploads` and are served by `/uploads/…`. Fine for
  development or a single long-lived server with a persistent disk. **Not** for Vercel.
- **`s3`**: any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2…). Set the `S3_*`
  variables; `S3_ENDPOINT` is only needed for non-AWS providers. The bucket (or a CDN in front of
  it) must serve files publicly at `S3_PUBLIC_URL`; that origin is automatically allowed by the
  image optimiser and the Content Security Policy. Give the access key only `PutObject`,
  `GetObject` and `DeleteObject` on that bucket.

## Email

Transactional emails: account verification, password reset, order confirmation and status
updates, newsletter confirmation and campaigns (with RFC 8058 one-click unsubscribe).

- **Development:** `EMAIL_PROVIDER=console` prints them to the terminal.
- **Resend:** `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and verify the domain in Resend (DNS
  records below).
- **SMTP:** `EMAIL_PROVIDER=smtp` with `SMTP_HOST`, `SMTP_PORT` (587 STARTTLS or 465 TLS),
  `SMTP_USER`, `SMTP_PASSWORD` — e.g. the mailbox provided by your hosting.
- `EMAIL_FROM` must be an address on a domain the provider has verified, e.g.
  `salut@alchimiaradacinilor.ro`. The display name and reply-to address are set in
  **Admin → Setări → Email**.

If no provider is configured in production, the site says emails cannot be sent instead of
pretending, and newsletter campaigns are disabled.

## Payments

The shop launches with **cash on delivery** and **bank transfer** (offered only after the IBAN and
account holder are filled in under **Admin → Setări → Plată**). Card payments are not simulated:
the provider interface is ready and [`docs/PAYMENTS.md`](docs/PAYMENTS.md) explains how to add
Stripe or Netopia (keys, redirect to the hosted payment page, webhook marking the order paid).
Totals are always recomputed on the server; the client only sends the total it displayed, to
detect price changes.

## Production deployment (Vercel + Postgres + S3)

1. **Database** — create a managed PostgreSQL 16 database (Neon, Supabase, Vercel Postgres, AWS
   RDS…) in an EU region (e.g. Frankfurt). Use the connection string with SSL
   (`?sslmode=require`). If the provider offers a pooled and a direct URL, use the **pooled** one
   for `DATABASE_URL` in Vercel and the **direct** one when running migrations.
2. **Storage** — create a bucket (e.g. Cloudflare R2 or S3 in `eu-central-1`) with public read
   (or a public custom domain/CDN) and an access key limited to that bucket.
3. **Email** — create a Resend account (or use SMTP) and verify `alchimiaradacinilor.ro`.
4. **Vercel project** — import the Git repository (framework: Next.js; install command
   `pnpm install`; build command `pnpm build`). Region: `fra1` (Frankfurt), close to the
   database. Set the environment variables for **Production** (and Preview, with separate
   database and bucket):

   ```text
   DATABASE_URL=postgresql://…pooled…?sslmode=require
   APP_URL=https://alchimiaradacinilor.ro
   AUTH_SECRET=<openssl rand -base64 32>
   EMAIL_PROVIDER=resend
   EMAIL_FROM=Alchimia Rădăcinilor <salut@alchimiaradacinilor.ro>
   RESEND_API_KEY=re_…
   STORAGE_DRIVER=s3
   S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com   # omit for AWS S3
   S3_REGION=auto                                           # or eu-central-1
   S3_BUCKET=alchimia-uploads
   S3_ACCESS_KEY_ID=…
   S3_SECRET_ACCESS_KEY=…
   S3_PUBLIC_URL=https://media.alchimiaradacinilor.ro
   ```

   `S3_PUBLIC_URL` and `APP_URL` are read at build time too (image optimiser, security headers):
   redeploy after changing them.

5. **Migrations and first data** — from your machine or CI, with the **direct** URL:

   ```bash
   DATABASE_URL="postgresql://…direct…" pnpm db:deploy
   DATABASE_URL="postgresql://…direct…" SEED_DEMO=false pnpm db:seed
   DATABASE_URL="postgresql://…direct…" ADMIN_EMAIL=… ADMIN_PASSWORD='…' pnpm admin:create
   ```

   Run `pnpm db:deploy` before every deployment that adds a migration (or add it to the CI
   pipeline before `vercel deploy`).

6. **Settings** — log in at `/admin/setari` and fill in brand, contact, shipping, payment (IBAN),
   email sender, SEO defaults and legal versions.

Security headers, the nonce-based Content Security Policy and HSTS are sent automatically (HSTS
and `upgrade-insecure-requests` when `APP_URL` is `https`). Rate limits are kept in memory per
server instance — enough against casual abuse; for stronger guarantees on serverless, move
`SlidingWindowLimiter` to a shared store (e.g. Upstash Redis).

## Domain: alchimiaradacinilor.ro at hostgate.ro

Keep the domain registered at Hostgate and point it to Vercel with DNS records. In the Hostgate
client area open the domain's **DNS management** (or the **Zone Editor** in cPanel if the domain
uses a Hostgate hosting package).

1. In Vercel: **Project → Settings → Domains**, add `alchimiaradacinilor.ro` and
   `www.alchimiaradacinilor.ro`; choose which one redirects to the other (recommended: `www` →
   apex). Vercel shows the exact records to create — **use the values it shows**; at the time of
   writing they are:

   | Type  | Host / name | Value                  | TTL  |
   | ----- | ----------- | ---------------------- | ---- |
   | A     | `@`         | `76.76.21.21`          | 3600 |
   | CNAME | `www`       | `cname.vercel-dns.com` | 3600 |

2. Remove any other `A`/`AAAA` record on `@` and any old `www` record (e.g. pointing to a
   Hostgate hosting server) — they would conflict.
3. **Do not touch the `MX` records** if your mailboxes (e.g. `salut@alchimiaradacinilor.ro`) are
   hosted at Hostgate.
4. **Email sending (Resend)** — add the records Resend shows when you add the domain; they look
   like this (they live on a `send` subdomain, so they do not affect your mailboxes):

   | Type | Host / name         | Value                                                       |
   | ---- | ------------------- | ----------------------------------------------------------- |
   | MX   | `send`              | `feedback-smtp.eu-west-1.amazonses.com` (priority 10)       |
   | TXT  | `send`              | `v=spf1 include:amazonses.com ~all`                         |
   | TXT  | `resend._domainkey` | `p=…` (DKIM key, copy it from Resend)                       |
   | TXT  | `_dmarc`            | `v=DMARC1; p=none; rua=mailto:dmarc@alchimiaradacinilor.ro` |

   If the apex already has an SPF record (from the Hostgate mailbox), keep a **single** SPF record
   on `@` — do not add a second one. Tighten DMARC to `p=quarantine` once reports look clean.

5. **Images domain (optional)** — for `media.alchimiaradacinilor.ro` on R2/S3, add the `CNAME`
   the storage provider gives you and set `S3_PUBLIC_URL` accordingly.
6. Wait for propagation (minutes to a few hours). Vercel issues the HTTPS certificate
   automatically once the records resolve. Then check `https://alchimiaradacinilor.ro`,
   `/robots.txt` and `/sitemap.xml`, and submit the sitemap in Google Search Console.

Alternative: change the domain's nameservers at Hostgate to Vercel's (`ns1.vercel-dns.com`,
`ns2.vercel-dns.com`) and manage all records in Vercel — then recreate the mail records there
first.

## Scripts

| Script                  | What it does                                                  |
| ----------------------- | ------------------------------------------------------------- |
| `pnpm dev`              | Development server                                            |
| `pnpm build`            | Production build                                              |
| `pnpm start`            | Serve the production build                                    |
| `pnpm check`            | Typecheck, lint, format check and unit tests                  |
| `pnpm test`             | Unit tests                                                    |
| `pnpm test:integration` | Integration tests against `DATABASE_URL_TEST` (truncated)     |
| `pnpm lint` / `format`  | ESLint / Prettier                                             |
| `pnpm db:migrate`       | Create/apply a migration in development                       |
| `pnpm db:deploy`        | Apply migrations in production                                |
| `pnpm db:seed`          | Seed (idempotent); `SEED_DEMO=false` skips the demo catalogue |
| `pnpm db:reset`         | Drop, re-migrate and re-seed (development)                    |
| `pnpm db:studio`        | Prisma Studio                                                 |
| `pnpm admin:create`     | Create or promote an administrator                            |

Integration tests apply the migrations to `DATABASE_URL_TEST` themselves before running and
truncate its tables between tests — never point it at a database you care about.

## Project structure

```
prisma/               schema, migrations, seed (data in prisma/seed/data)
public/               static files (default social image)
scripts/              create-admin
src/app/              routes only: (site) storefront, admin, api, sitemap, robots, uploads
src/features/<x>/     UI + server actions per domain (catalog, cart, checkout, quiz, admin, …)
src/services/         business logic and data access (server-only), pure modules with tests
src/validation/       Zod schemas shared by forms, actions, routes and settings
src/lib/              infrastructure: db, env, money, dates, seo, security headers, storage, email
src/components/       design-system primitives, layout, motion, botanical illustrations
tests/integration/    service tests against a real database
docs/                 PROGRESS, DECISIONS, AUDIT, PAYMENTS, FINAL-REPORT
```

## Before launch

See [`docs/FINAL-REPORT.md`](docs/FINAL-REPORT.md) for the full list. In short: real products
(names, photos, official specifications, usage and safety texts from the producers), the owner's
company details and a legal review of the terms, privacy, cookie and return policies (the gaps
are marked "[De completat: …]" on those pages), shipping couriers and delivery times, production credentials
(database, storage, email) and — if wanted — a card payment provider.
