# Progress: content + doTERRA referral pivot

Plan: [`PIVOT_PLAN.md`](./PIVOT_PLAN.md). The original shop build (phases 1–14) is logged in
[`archive/PROGRESS-SHOP-BUILD.md`](./archive/PROGRESS-SHOP-BUILD.md).

Every phase ends with `pnpm check`, `pnpm test:integration`, a browser pass and a stop for the
owner's review. No commit, push or deploy without explicit approval.

## Phase overview

| Phase | Scope                                                                                 | Status                    |
| ----- | ------------------------------------------------------------------------------------- | ------------------------- |
| 1     | Inspection and pivot plan                                                             | Done, approved 2026-10-25 |
| 2     | Remove commerce (backup, archive migration, code removal, redirects)                  | Done, waiting for review  |
| 3     | doTERRA outbound links (link per product, affiliate setting, click counter)           | Done, waiting for review  |
| 4     | Restructure and rewrite (navigation, new pages, copy, legal, SEO schema)              | Done, waiting for review  |
| 5     | Colour palette editor                                                                 | Done, waiting for review  |
| 6     | Products and packages (kits, curated packages, editorial reviews, contract migration) | Not started               |
| 7     | Newsletter rewrite                                                                    | Not started               |
| 8     | Accounts and audience growth (follows, saved articles, notifications)                 | Not started               |
| 9     | Final QA                                                                              | Not started               |

## Phase 1: Inspection and plan

- Inspected the whole repository: routes, features, services, Prisma schema (8 migrations),
  admin, emails, tests (58 unit files, 13 integration suites), legal pages, SEO, hosting config.
- Wrote `docs/PIVOT_PLAN.md`: stack summary, REMOVE/ADAPT/KEEP inventory, new information
  architecture, data model changes with safe migration rules, redirect map, phases 2–9, open
  questions.
- Moved the old `docs/PROGRESS.md` to `docs/archive/PROGRESS-SHOP-BUILD.md` (content unchanged).
- No code, schema or test changed.

**Waiting on**

- Approval of the plan.
- Answers to the open questions (`PIVOT_PLAN.md` § 7). Phase 2 needs Q11 (real orders in
  production?) and Q13 (is the site indexed?); phase 3 needs Q1–Q3.

## Phase 2: Remove commerce

- **Backup** of the local database before any change (see the log below). Production not backed
  up yet: required before deploying.
- **Archive migration** `20261025120000_archive_commerce`: the 12 commerce tables and their 5
  enum types move to the `legacy_commerce` schema (nothing dropped); the reviews → order items
  foreign key is dropped, `reviews.orderItemId` values stay. Prisma only sees `public`.
- **Removed**: cart, checkout, orders, addresses, coupons, NETOPIA payments (pages, features,
  services, validation, emails, tests), the order/coupon admin, the shipping/payment/VAT settings,
  the `orders:manage` permission, the `NETOPIA_*` env vars, the cart/checkout/order analytics
  events, stock and compare-at prices everywhere in the UI, seed and recommendation ties.
- **Redirects (301)**: `/cos` → `/favorite`, `/finalizare-comanda/*` → `/produse`,
  `/cont/comenzi/*` → `/cont`, `/cont/adrese` → `/cont/date-personale`,
  `/livrare-si-retur` and `/politica-de-retur` → `/cum-cumpar`, `/admin/comenzi/*` and
  `/admin/cupoane/*` → `/admin`. `/api/plati/*` answers 410.
- **New**: `/cum-cumpar` (purchases happen on doTERRA); the product page shows "Preț pe
  site-ul doTERRA" and "Linkul către produs va fi disponibil în curând".
- **Adapted**: reviews (any member with a confirmed email; no "verified purchase" badge until the
  doTERRA check exists), newsletter segment "Doar membri cu cont" (old campaigns'
  `customersOnly` is read as `membersOnly`), admin dashboard (audience instead of sales), member
  pages, FAQ, interim legal pages (terms, privacy, cookies, still marked for the lawyer) and copy
  that mentioned orders, cart, delivery or the shop.
- **Checks**: `pnpm typecheck`, `pnpm lint`, `prettier` on changed files, `pnpm test` (47 files,
  264 tests), `pnpm test:integration` (12 suites, 75 tests), `pnpm build`, `prisma db seed`;
  redirects, the 410 and 15 key pages checked with curl on `next start`.

**Before deploying phase 2**

- A fresh Neon backup right before the deploy (the 2026-10-25 dump below may be outdated by then).
- Remove `NETOPIA_ENV`, `NETOPIA_API_KEY`, `NETOPIA_POS_SIGNATURE`, `NETOPIA_PUBLIC_KEY`
  from Netlify.
- Owner approval (deploy costs build credits).

## Phase 3: doTERRA outbound links

- **Migration** `20261025180000_doterra_links` (additive, nothing moved): `products` gains
  `referralUrl`, `doterraItemNumber` (unique), `priceCheckedAt`, `linkCheckedAt`,
  `linkStatus` (UNCHECKED/OK/BROKEN); new table `outbound_clicks_daily` (product, day, source,
  count).
- **Setting** `affiliate` (Setări › Linkuri doTERRA): allowed domains (default `doterra.com`,
  `doterra.me`, subdomains included), short and long disclosure texts.
- **Admin**: the product form has "Preț și link doTERRA" (link, doTERRA item number, "Am verificat
  azi prețul"); a saved link must be https on an allowed domain, a changed link goes back to
  "Netestat". The edit page has a "Link doTERRA" card with the status, the last test date,
  "Testează linkul" (a server request that only follows redirects inside the allowed domains) and
  "Deschide linkul". The product list shows the link status and filters "Fără link" /
  "Nefuncțional". The dashboard shows clicks to doTERRA (30 days vs the 30 before), the most
  clicked products, clicks per button location, and a notice with the active products without a
  link.
- **Site**: "Cumpără de pe doTERRA" (new tab, `rel="sponsored noopener"`) on the product page,
  the quick view, the quiz result, rituals and favourites; without a link it shows "Link în
  curând". The product page shows the short disclosure and "verificat pe <data>" when the price
  date is known (products imported before phase 3 have none until the owner confirms the price).
  `/cum-cumpar#recomandare`, the terms and the privacy policy explain the referral links and the
  anonymous click count.
- **Counter** `/spre-doterra/[slug]?sursa=…`: +1 per product, day and source, then 302 to the
  saved link (re-checked against the allowed domains). Not counted: HEAD, prefetch, bots, more than
  30 clicks per IP in 10 minutes (kept in memory only). No link → the product page; inactive or
  unknown product → `/produse`. `no-store`, `noindex`, disallowed in robots.txt.
- **Checks**: `pnpm typecheck`, `pnpm lint`, `prettier` on changed files, `pnpm test`
  (47 files, 267 tests), `pnpm test:integration` (13 suites, 84 tests, new
  `affiliate.int.test.ts`), `pnpm build`; the counter, the redirects and the pages checked with
  curl on `next start` against the local copy of production data.

**Linked products first (owner request, 2026-10-25, D-092)**

- Products with a referral link come first in every product list: catalogue and categories (every
  sort), search, related products, journal articles, favourites, quiz results and
  recommendations. Ritual steps keep their order, and so does the admin-curated "Cele 5 esențiale"
  block.
- Home page: a new "Disponibile pe doTERRA" section right under the hero, with up to 8 linked
  products (featured, then newest) and their "Cumpără de pe doTERRA" button (`?sursa=acasa`,
  "Prima pagină" on the dashboard). The "Recomandate" block also puts linked products first.
- Product cards and the product page show a "Pe doTERRA" badge. The small button wraps onto two
  lines on narrow cards (two per row on phones), instead of overflowing.

**Waiting for the owner**

- The referral link for each product (Setări › Linkuri doTERRA for the domains; each product's
  form for its link). Until then every product shows "Link în curând".
- Review of the two disclosure texts (PIVOT_PLAN Q16).
- Whether `doterra.me` stays an allowed domain.
- CSV import of links: not built yet (optional, later).

**Before deploying phase 3**: deploy together with or after phase 2; `prisma migrate deploy`
applies the additive migration.

## Phase 4: Restructure and rewrite

- **Renamed sections** (Q5, Q6): Rutine → Ritualuri (`/ritualuri`, `/cont/ritualuri`,
  `/admin/ritualuri`), Favorite → Salvate (`/salvate`, `/cont/salvate`), Clienți → Membri
  (`/admin/membri`). The old URLs answer 301 (`next.config.ts`); `/cos` now goes to `/salvate`.
- **Navigation** as in PIVOT_PLAN § 3.2: header Jurnal · Recenzii · Ritualuri · Produse ·
  Descoperă · Despre, "Cum cumpăr de pe doTERRA" under the Produse menu; mobile bottom nav Acasă ·
  Jurnal · Caută · Salvate · Cont; footer with the newsletter first, Explorează / Despre / Legal
  columns and the disclosure line. The ANPC consumer link is gone (no sales).
- **New pages**: `/recenzii` (member reviews; editorial reviews join in phase 6) and
  `/transparenta-afiliere`. Both are in the sitemap and the footer.
- **Copy** rewritten where it assumed selling: home, product page, FAQ, about, contact, auth and
  account pages, empty states, emails, admin labels, default SEO description. Terms, privacy and
  cookies rewritten for a content + referral site (still marked for the lawyer).
- **SEO**: `Product` JSON-LD has no `Offer`; sitemap and robots use the new paths.
- Intentional: the journal category slug `rutine` and the `{{rutina:…}}` embed tag stay so existing
  articles keep working.

## Phase 5: Colour palette editor

- New `theme` setting (no migration: site settings are JSON): the palette plus up to 12 saved
  themes. Every colour is validated as `#rrggbb` and the whole palette must pass the WCAG AA pairs
  in `src/lib/palette.ts`; saving a failing palette is refused with the pair and its ratio.
- The root layout writes overridden tokens as CSS variables in a `<style>` tag (only when they
  differ from `globals.css`) and uses `paper` as the browser theme colour. `style-src` already
  allows inline styles, so no nonce is needed.
- `/admin/setari/culori` (Setări and the admin sidebar link to it): pickers grouped by role, live
  preview (buttons, cards, product card, article, email header), contrast check per pair, reset to
  default, built-in and saved themes.
- Emails read the same palette (`emailBrand()` in `src/services/email.ts`).
- **Product photo backdrop** (owner request, 2026-10-26): every product photo has the cream
  backdrop baked in (`#f0e9dc`, opaque), so a CSS colour cannot show through. New colour "Fundalul
  fotografiilor de produs": when it differs, an SVG colour matrix tints product photos (cards,
  gallery, quick view, search, category tiles) so the baked cream lands exactly on it; shading and
  shadows stay. It must pass ink contrast, which keeps it light (the tint looks wrong on dark
  colours). Themes saved before it existed take their `paperDeep`. Photos in emails keep the cream.

**Checks (2026-10-26)**: `pnpm typecheck`, `pnpm lint`, `prettier` on changed files, `pnpm test`
(49 files, 287 tests), `pnpm test:integration` (13 suites, 84 tests), `pnpm build`; public pages,
the sitemap and every renamed-URL redirect checked with curl against the local copy of production
data. Not done yet: a browser pass on the changed pages and on `/admin/setari/culori`.

**Before deploying phases 4–5**: no migration; deploy after phases 2–3.

## Local copy of production data (2026-10-25)

- The local `alchimia` database (port 5433) was replaced by the production dump (backup of the
  previous local database: `storage/backups/2026-10-25-production/local-before-import.dump`).
  Row counts matched production table by table.
- `prisma migrate deploy` then applied `20261025120000_archive_commerce` to that copy: a
  rehearsal on real data. The 6 orders, 23 order lines and 2 coupons are kept in
  `legacy_commerce`; the one review linked to an order keeps its `orderItemId`.
- Production's `_prisma_migrations` lists the first 6 migrations twice (harmless; Prisma
  applied only the new migration).
- The 21 images that existed only in production storage were downloaded from the public
  `/uploads/…` URLs into `storage/uploads/`. Copied sessions and verification tokens were
  deleted locally.

## Backups log

Every migration that moves or removes data records its backup here first: date, database,
command, file name, table row counts.

| Date       | Database                                  | Backup                                                                            | Row counts                                                                                                   | Before migration                                                  |
| ---------- | ----------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| 2026-10-25 | local (5433)                              | `pg_dump -Fc` + CSV per commerce table, `storage/backups/2026-10-25-pre-phase2/`  | all 12 commerce tables 0, reviews 0, site_settings 11, users 1                                               | `20261025120000_archive_commerce`                                 |
| 2026-10-25 | production (Neon, read-only `pg_dump` 18) | `storage/backups/2026-10-25-production/neon-production.dump` (+ `row-counts.txt`) | orders 6, order_items 23, coupons 2, carts 3, addresses 3, reviews 1, users 5, products 18, site_settings 11 | `20261025120000_archive_commerce` (not applied in production yet) |

## Intentional leftovers

Commerce-looking names that stay on purpose after phase 2 (with the reason) go here.

- `products.compare_at_price` and `products.stock` columns: unused, dropped in phase 6.
- `reviews.orderItemId`: keeps the link of any review written while the shop sold; drives the
  "Cumpărare verificată" badge until phase 6 replaces it.
- Old `?stoc=1` catalogue links: the parameter is ignored (the page still works), not redirected.
- `site_settings` rows `shipping`, `payment`, `tax`: kept in the database, no longer read.
- `legacy_commerce` foreign keys to `users` and `products` stay: deleting a user removes their
  archived cart and addresses (cascade) and nulls the user on archived orders; deleting a product
  nulls it on archived order lines (their snapshot stays).
