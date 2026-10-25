# Pivot plan: from online shop to content + doTERRA referral platform

Status: **approved 2026-10-25, phases 2 and 3 done, waiting for review.** Progress is tracked in
[`PROGRESS.md`](./PROGRESS.md). The original shop build log moved to
[`archive/PROGRESS-SHOP-BUILD.md`](./archive/PROGRESS-SHOP-BUILD.md).

## Owner decisions (2026-10-25)

These override anything below that says otherwise.

| Topic                  | Decision                                                                                                                                                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Site status            | Live at alchimiaradacinilor.ro: keep URLs where possible, full 301 map (section 5)                                                                                                                                                                                                                                 |
| Prices (Q3)            | **Prices stay**, but each one is the price a visitor sees on the doTERRA site (no markup), shown as "Preț pe doTERRA" with the date it was checked. `compareAtPrice` (discounts) and `stock` go. Price filters, price sorting and the quiz budget answers stay                                                     |
| Referral link (Q1)     | **Full referral link pasted per product** in the admin (products, kits, packages). Validated as `https` on a doTERRA domain, "Testează linkul" button, last-checked date, "Produse fără link" list, optional CSV import (product, link, price). No global link template                                            |
| Outbound click         | Through `/spre-doterra/[slug]`: counted (no personal data, no cookie), then 302 to the referral link                                                                                                                                                                                                               |
| Product without a link | Stays visible with description and price; "Link în curând" instead of the button                                                                                                                                                                                                                                   |
| Blog vs Jurnal         | One section, **Jurnal** (`/jurnal` URLs stay). Main menu: Jurnal · Recenzii · Ritualuri · Produse                                                                                                                                                                                                                  |
| Customer reviews (Q8)  | **Stay open.** Unverified reviews are accepted (moderated, no badge). A "Cumpărare verificată" badge comes from a verification flow: the customer gives the doTERRA order number, the admin checks it in the doTERRA back office. Automatic matching (CSV export from the back office) later, if doTERRA allows it |
| Old orders/addresses   | None expected; commerce tables are still archived (not dropped) as a safety net                                                                                                                                                                                                                                    |

The client's own list of requirements, for reference: palette editor; remove payment, cart and
everything about buying (ANAF); redirect to doTERRA product pages with the owner's referral; new
packages and products; structure as a blog (Jurnal, Recenzii, Ritualuri) that no longer looks like
a shop; newsletters stay with new text linking to the product page on the site, then to doTERRA;
registration stays to build an audience of active followers; grow the member base.

**Goal.** alchimiaradacinilor.ro stops selling. Each product page links out to the official doTERRA
shop, where the visitor buys and the owner gets a referral reward. The site becomes a journal,
editorial product reviews, rituals and discovery (quiz, needs). Accounts and the newsletter stay;
the aim is an audience that comes back for new posts.

**Rule for every phase.** After phase 2 the site must not offer anything that looks like a sale:
no price shown as "our price", no stock, no basket, no "buy" button that stays on our domain, no
order or payment email.

---

## 1. Current stack and architecture

| Area      | What is there today                                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | Next.js 16.3 (App Router, Server Components, Server Actions, `proxy.ts`), React 19.2, TypeScript strict                                                                          |
| Styling   | Tailwind CSS v4 with tokens in `src/app/globals.css` (`@theme`); Radix primitives; framer-motion; Fraunces + Manrope via `next/font`                                             |
| Data      | PostgreSQL + Prisma 7.10 (`@prisma/adapter-pg`), client generated into `src/generated/prisma`; 8 migrations; seed in `prisma/seed/` (demo data flagged `isDemo`)                 |
| Auth      | Custom: argon2id, hashed session tokens (`ar_session`), email verification, password reset, roles `customer` / `editor` / `admin`, permissions in `services/auth/permissions.ts` |
| Email     | Provider abstraction (console, Resend, SMTP) + Brevo for the newsletter list and designed campaigns                                                                              |
| Payments  | NETOPIA card (hosted page + signed IPN), cash on delivery, bank transfer                                                                                                         |
| Storage   | Local, S3 or Netlify Blobs (`lib/storage`), uploads served by `app/uploads/[...key]`                                                                                             |
| Analytics | First-party, consent-gated `AnalyticsEvent` table                                                                                                                                |
| Hosting   | Netlify (Next adapter) + Neon Postgres; `pnpm db:deploy` runs on production deploys (`netlify.toml`). README also documents Vercel and self-hosting                              |
| Tests     | Vitest: 58 unit test files in `src/**`, 13 integration suites in `tests/integration` (real Postgres)                                                                             |

**Code layout.** `app/(site)` holds public pages, `app/admin` the back office, `app/api` the routes
(search, analytics, Brevo webhook, newsletter unsubscribe, NETOPIA). UI lives in `components/`
(primitives, layout, motion, botanical motifs) and `features/<domain>/` (client components +
Server Actions). Business logic lives in `services/<domain>/` (pure parts unit-tested), and Zod
schemas in `validation/`. Site-wide configuration is the `SiteSetting` key/value table validated
by `validation/settings.ts`, so new settings need no migration.

**Repository note.** The app is its own git repo (`alchimiaradacinilor/`, remote
`TiGabriel/alchimiaradacinilor`). The parent folder `AlchimiaRadacinilor/` is a second repo with
no commits that has the app staged as a gitlink, plus `newsletters/` and `poze-rutine/` untracked.
See open question Q14.

---

## 2. Inventory: commerce-related code

**REMOVE** = delete the code (data handled per section 4). **ADAPT** = keep, but change behaviour or
copy. **KEEP** = unchanged, or only renamed.

### 2.1 Public routes (`src/app/(site)`)

| Route                                                                                                                                                                               | Verdict | Notes                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| `/cos`                                                                                                                                                                              | REMOVE  | 301, section 5                                                                                                   |
| `/finalizare-comanda`, `/finalizare-comanda/confirmare/[numar]`                                                                                                                     | REMOVE  | 301                                                                                                              |
| `/cont/comenzi`, `/cont/comenzi/[numar]`                                                                                                                                            | REMOVE  | 301 to `/cont`                                                                                                   |
| `/cont/adrese`                                                                                                                                                                      | REMOVE  | Addresses only served delivery and invoicing                                                                     |
| `/livrare-si-retur`, `/politica-de-retur`                                                                                                                                           | REMOVE  | Replaced by `/cum-cumpar`                                                                                        |
| `/produs/[slug]`                                                                                                                                                                    | ADAPT   | No price, stock, quantity or basket. Outbound doTERRA button + affiliate disclosure. Remove `Offer` from JSON-LD |
| `/produse`, `/produse/[...segments]`                                                                                                                                                | ADAPT   | Drop the price and availability filters and the price sorts. Keep needs, aroma, type and tags                    |
| `/favorite`                                                                                                                                                                         | ADAPT   | "Mută în coș" becomes "Vezi pe doTERRA". Rename to "Salvate" (Q6)                                                |
| `/quiz`, `/quiz/rezultat/[id]`                                                                                                                                                      | ADAPT   | Result: no basket, outbound links; budget answers lose their meaning (section 2.4)                               |
| `/rutine`, `/rutine/[slug]`                                                                                                                                                         | ADAPT   | Drop "Adaugă rutina în coș". Possibly rename to `/ritualuri` (Q5)                                                |
| `/` (home)                                                                                                                                                                          | ADAPT   | Essentials without prices; journal and reviews first                                                             |
| `/cont` (overview)                                                                                                                                                                  | ADAPT   | Drop "ultima comandă"; add followed topics, saved articles, notifications                                        |
| `/termeni-si-conditii`, `/politica-de-confidentialitate`, `/politica-cookies`                                                                                                       | ADAPT   | Rewrite with no sale; remove the `ar_cart` cookie; data processing without orders or addresses                   |
| `/intrebari-frecvente`, `/despre`                                                                                                                                                   | ADAPT   | Copy about orders, delivery and payment becomes "how to buy from doTERRA"                                        |
| `/jurnal`, `/jurnal/[slug]`, `/descopera/**`, `/cautare`, `/contact`, `/newsletter/**`, auth pages, `/cont/{date-personale,favorite,newsletter,quiz,recomandari,rutine,securitate}` | KEEP    | Copy check in phase 4                                                                                            |
| `/styleguide`                                                                                                                                                                       | ADAPT   | Remove Price, QuantitySelector and AddToCart demos                                                               |

### 2.2 API routes

| Route                                               | Verdict                                      |
| --------------------------------------------------- | -------------------------------------------- |
| `api/plati/netopia/ipn`, `api/plati/netopia/retur`  | REMOVE (answer **410 Gone**, not a redirect) |
| `api/search`                                        | ADAPT (remove price from product hits)       |
| `api/analytics`                                     | ADAPT (new event list)                       |
| `api/newsletter/brevo`, `api/newsletter/dezabonare` | KEEP                                         |

### 2.3 Components and features

| Path                                                                                                                                                                                                                                                       | Verdict | Notes                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | --------------------------------------------------------- |
| `features/cart/*` (13 files: actions, context, drawer, line, page, refresh, suggestions, summary, coupon form, free-shipping progress, owner, add-to-cart button)                                                                                          | REMOVE  |                                                           |
| `features/checkout/*` (actions, address fields, checkout flow, retry card payment)                                                                                                                                                                         | REMOVE  |                                                           |
| `features/orders/order-detail.tsx`                                                                                                                                                                                                                         | REMOVE  |                                                           |
| `features/account/address-manager.tsx`                                                                                                                                                                                                                     | REMOVE  |                                                           |
| `features/catalog/product-purchase.tsx`                                                                                                                                                                                                                    | REMOVE  | Replaced by a new `features/affiliate/buy-on-doterra.tsx` |
| `features/catalog/quick-view.tsx`                                                                                                                                                                                                                          | ADAPT   | Outbound button instead of basket, or remove (Q7)         |
| `features/catalog/product-card.tsx`, `product-badges.tsx`, `filter-panel.tsx`                                                                                                                                                                              | ADAPT   | No price, discount, stock or quick-add                    |
| `features/home/essentials.tsx`, `features/quiz/primary-recommendation.tsx`, `features/routines/routine-actions.tsx`, `features/wishlist/favorites-view.tsx`, `features/search/search-palette.tsx`, `features/journal/article-content.tsx` (product embeds) | ADAPT   | Remove price and basket; outbound link where useful       |
| `features/auth/on-sign-in.ts`                                                                                                                                                                                                                              | ADAPT   | Drop the guest cart merge; keep the wishlist merge        |
| `features/reviews/*`, `features/home/reviews.tsx`                                                                                                                                                                                                          | ADAPT   | See "customer reviews" (section 4.6, Q8)                  |
| `components/ui/price.tsx`, `components/ui/quantity-selector.tsx`                                                                                                                                                                                           | REMOVE  | Unless a reference price is kept (Q3)                     |
| `components/layout/header/header-actions.tsx`, `mobile-bottom-nav.tsx`, `mobile-menu.tsx`, `desktop-nav.tsx`, `nav-config.ts`, `providers.tsx` (CartProvider)                                                                                              | ADAPT   | Remove cart icon and counter; new navigation (section 3)  |
| `components/layout/footer/site-footer.tsx`                                                                                                                                                                                                                 | ADAPT   | Legal and help links, affiliate disclosure line           |

### 2.4 Services, validation and lib

| Path                                                                                                  | Verdict        | Notes                                                                                                                            |
| ----------------------------------------------------------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `services/cart/*` (calculate, cart, merge, routine)                                                   | REMOVE         |                                                                                                                                  |
| `services/checkout/*` (pricing, quote)                                                                | REMOVE         |                                                                                                                                  |
| `services/orders/*` (format, notifications, orders, place, status)                                    | REMOVE         |                                                                                                                                  |
| `services/payments/*` (methods, netopia, netopia-service, registry)                                   | REMOVE         |                                                                                                                                  |
| `services/coupons/*`                                                                                  | REMOVE         |                                                                                                                                  |
| `services/routines/routine-cart.ts`                                                                   | REMOVE         |                                                                                                                                  |
| `services/account/addresses.ts`                                                                       | REMOVE         |                                                                                                                                  |
| `services/admin/orders.ts`, `services/admin/coupons.ts`                                               | REMOVE         |                                                                                                                                  |
| `services/admin/customers.ts`                                                                         | ADAPT          | Becomes "Membri": accounts, consent, saved items, follows; no orders                                                             |
| `services/admin/dashboard.ts`, `services/admin/metrics.ts`                                            | ADAPT          | Revenue and orders become outbound clicks, new members, subscribers, top articles                                                |
| `services/account/overview.ts`                                                                        | ADAPT          | Drop the last order                                                                                                              |
| `services/reviews/reviews.ts`, `rules.ts`                                                             | ADAPT          | Eligibility can no longer be "verified purchase" (Q8)                                                                            |
| `services/newsletter/segment.ts`                                                                      | ADAPT          | `customersOnly` (people with orders) becomes `membersOnly` (subscribers with an account)                                         |
| `services/recommendation/engine.ts`                                                                   | ADAPT          | Remove budget penalty (`maxPrice`); remove the stock filter                                                                      |
| `services/catalog/listing.ts`, `products.ts`, `product-detail.ts`, `product-types.ts` (`stockStatus`) | ADAPT          | Remove price and stock facets and sorts; select the outbound link                                                                |
| `services/home/select.ts`, `services/search/sources/products.ts`                                      | ADAPT          | No price or availability                                                                                                         |
| `services/settings.ts` + `validation/settings.ts`                                                     | ADAPT          | Remove `shipping`, `payment`, `tax`; add `affiliate` (phase 3) and `theme` (phase 5)                                             |
| `validation/cart.ts`, `checkout.ts`, `address.ts`, `admin/coupon.ts`                                  | REMOVE         |                                                                                                                                  |
| `validation/admin/product.ts`, `validation/admin/common.ts` (money fields)                            | ADAPT          | Price and stock out; doTERRA link in                                                                                             |
| `lib/money.ts`                                                                                        | REMOVE or KEEP | Only if a reference price stays (Q3)                                                                                             |
| `lib/analytics/events.ts`                                                                             | ADAPT          | Remove `add_to_cart`, `checkout_started`, `order_completed`; add `outbound_click`, `article_read`, `follow`, `newsletter_signup` |
| `lib/email/templates/orders.ts`                                                                       | REMOVE         |                                                                                                                                  |
| `lib/env.ts`, `.env.example`                                                                          | ADAPT          | Remove `NETOPIA_*`                                                                                                               |
| `proxy.ts`                                                                                            | ADAPT          | Remove `/finalizare-comanda` from protected prefixes                                                                             |
| `app/robots.ts`, `app/sitemap.ts`                                                                     | ADAPT          | Remove `/cos`, `/finalizare-comanda`, delivery and return pages; add new sections                                                |

### 2.5 Admin (`src/app/admin`, `features/admin`)

| Page / feature                                                           | Verdict                                                                           |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `/admin/comenzi`, `/admin/comenzi/[id]`, `features/admin/orders/*`       | REMOVE                                                                            |
| `/admin/cupoane/**`, `features/admin/coupons/*`                          | REMOVE                                                                            |
| `/admin/clienti/**`                                                      | ADAPT ("Membri", no orders column)                                                |
| `/admin` (dashboard), `features/admin/charts.tsx`                        | ADAPT (audience and click metrics)                                                |
| `/admin/produse/**`, `features/admin/products/*` (form, defaults)        | ADAPT (no price or stock; doTERRA link + link checker; kit contents stay)         |
| `/admin/setari`, `features/admin/settings/*`                             | ADAPT (no shipping, payment or VAT; affiliate settings; later the palette editor) |
| `/admin/quiz`, `features/admin/quiz/quiz-editor.tsx`                     | ADAPT (budget field removed)                                                      |
| `/admin/recenzii`                                                        | ADAPT (per Q8)                                                                    |
| `features/admin/nav.ts` + test                                           | ADAPT ("Vânzări" group removed; new "Audiență" group)                             |
| `services/auth/permissions.ts`                                           | ADAPT (`orders:manage` removed; maybe `audience:manage`)                          |
| `/admin/jurnal`, `/admin/rutine`, `/admin/newsletter/**`, taxonomy pages | KEEP, extended in phases 4, 6 and 7                                               |

### 2.6 Database models (see section 4 for how)

| Model / enum                                                                                                    | Verdict                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `Cart`, `CartItem`                                                                                              | REMOVE (guest carts are disposable; backed up anyway)                                |
| `Order`, `OrderItem`, `OrderAddress`, `OrderStatusEvent`, `OrderCounter`                                        | ARCHIVE (kept in a `legacy_commerce` schema, out of Prisma)                          |
| `Coupon`, `CouponProduct`, `CouponCategory`, `CouponUsage`                                                      | ARCHIVE                                                                              |
| `Address`                                                                                                       | ARCHIVE, then delete once retention is confirmed (Q11)                               |
| Enums `OrderStatus`, `PaymentStatus`, `PaymentMethod`, `AddressType`, `CouponType`                              | REMOVE from Prisma (the archived tables keep their values as text)                   |
| `Product.price`, `compareAtPrice`, `stock`                                                                      | Phase 2: stop reading. Phase 6: drop after backup (or keep `price` as reference, Q3) |
| `Product.sku`                                                                                                   | ADAPT: becomes the doTERRA item number (Q2)                                          |
| `Product.rating`, `reviewCount`                                                                                 | KEEP if customer reviews stay (Q8)                                                   |
| `Review.orderItemId`                                                                                            | ADAPT: set to null when orders are archived; column dropped in phase 6               |
| `QuizAnswer.maxPrice`                                                                                           | Phase 2: ignored. Phase 6: drop after backup                                         |
| `User.emailVerifiedAt`                                                                                          | KEEP (only the comment "required before ordering" changes)                           |
| `SiteSetting` keys `shipping`, `payment`, `tax`                                                                 | REMOVE from the registry; rows deleted after backup                                  |
| `AnalyticsEvent` rows with commerce names                                                                       | KEEP (history); names removed from the allowed list                                  |
| Everything else (catalogue taxonomy, quiz, routines, articles, wishlist, newsletter, consent, auth, media, SEO) | KEEP                                                                                 |

### 2.7 Emails

| Template                                                                                                           | Verdict                                                           |
| ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `orderConfirmationEmail`, `orderStatusEmail` (`lib/email/templates/orders.ts`, `services/orders/notifications.ts`) | REMOVE                                                            |
| Account emails (verification, welcome, reset, contact)                                                             | ADAPT copy (welcome: follow topics, newsletter; no "first order") |
| Newsletter confirm + `campaignEmail`, Brevo designed campaigns                                                     | ADAPT in phase 7 (new layout, "new post" digest)                  |
| `newsletters/brevo/01-promotie-toamna15.html` (outside the repo: coupon `TOAMNA15`, prices)                        | REMOVE / do not send                                              |
| `02-cele-5-esentiale`, `03-difuzoare-colt-linistit`                                                                | ADAPT (outbound links, no prices)                                 |

### 2.8 Tests

| Test                                                                                                                                                                                                                                                                                                                              | Verdict                                                                                                    |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `services/cart/calculate.test`, `cart/merge.test`, `checkout/pricing.test`, `coupons/evaluate.test`, `orders/status.test`, `payments/methods.test`, `payments/netopia.test`, `payments/netopia-service.test`, `routines/routine-cart.test`, `validation/checkout.test`, `validation/address.test`, `validation/admin/coupon.test` | REMOVE                                                                                                     |
| `lib/money.test`                                                                                                                                                                                                                                                                                                                  | REMOVE (or KEEP with Q3)                                                                                   |
| `reviews/rules.test`, `admin/metrics.test`, `newsletter/segment.test`, `lib/analytics/events.test`, `validation/admin/product.test`, `validation/settings.test`, `catalog/listing.test`, `recommendation/engine.test`, `home/select.test`, `features/admin/nav.test`, `email/email.test`                                          | ADAPT                                                                                                      |
| Integration: `orders.int`                                                                                                                                                                                                                                                                                                         | REMOVE                                                                                                     |
| Integration: `cart-merge.int`                                                                                                                                                                                                                                                                                                     | ADAPT (wishlist merge only)                                                                                |
| Integration: `admin.int` ("orders admin" block), `reviews.int`, `content.int`, `home.int`, `helpers.ts`                                                                                                                                                                                                                           | ADAPT                                                                                                      |
| New                                                                                                                                                                                                                                                                                                                               | outbound link builder, click counter, redirect map, follow/notification services, palette contrast checker |

### 2.9 Legal pages, SEO and docs

- **Legal:** terms become terms of use for a content site (no consumer sales contract, so the ANPC
  SAL/SOL sales obligations stop applying; keep an ANPC link only if the lawyer says so). Privacy:
  remove order, delivery and invoicing data; add follows, notifications, outbound click counting.
  Cookies: remove `ar_cart`. New page: affiliate disclosure. Every outbound product link carries
  `rel="sponsored noopener"` and a visible disclosure next to the button.
- **SEO schema:** `Product` JSON-LD loses `offers` (we are not the seller; an `Offer` with our site
  as `seller` would be false). Product pages keep `Product` + `BreadcrumbList`; editorial reviews
  use `Review` with `itemReviewed: Product`; articles keep `BlogPosting`; rituals keep `HowTo`.
  `Organization` in `services/seo.ts` loses anything store-like.
- **Docs:** `PAYMENTS.md`, `AUDIT.md`, `FINAL-REPORT.md` move to `docs/archive/`. README rewritten in
  phase 9. New `DECISIONS.md` entries (D-085 onward) for every pivot decision.
- **Untracked SQL dumps** at the repo root (`alchimia_data.sql`, `alchimia_local.dump`, `import_*.sql`):
  they may contain real customer data. Keep them out of git and move them under `storage/` (Q14).

---

## 3. New information architecture

### 3.1 Sections

| Section              | URL                                                                                                     | Content                                                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acasă                | `/`                                                                                                     | Latest posts, one featured review, ritual of the week, quiz invitation, "Cele 5 esențiale" (no prices), newsletter and account invitation           |
| Jurnal               | `/jurnal`, `/jurnal/[categorie]`, `/jurnal/[slug]`                                                      | Blog: stories, guides, seasonal posts. Unchanged URLs                                                                                               |
| Recenzii             | `/recenzii`, `/recenzii/[slug]`                                                                         | Editorial product reviews: verdict, pros and cons, how it was tested, links to the product sheet and to doTERRA                                     |
| Ritualuri            | `/ritualuri`, `/ritualuri/[slug]`                                                                       | Today's routines (Q5: rename from `/rutine`)                                                                                                        |
| Produse              | `/produse`, `/produse/[categorie]/[subcategorie]`, `/produs/[slug]`                                     | A product guide, not a shop: aroma profile, uses, safety, the reviews and rituals that use it, "Cumpără de pe doTERRA" button                       |
| Kituri și pachete    | `/pachete`, `/pachete/[slug]`                                                                           | Official doTERRA kits + curated packages (section 4.3)                                                                                              |
| Descoperă            | `/descopera`, `/descopera/nevoi`, `/descopera/[nevoie]`, `/quiz`                                        | Kept: the quiz now ends in a reading list (product sheets + rituals + articles), not a basket                                                       |
| Cum cumpăr           | `/cum-cumpar`                                                                                           | How buying through doTERRA works, the referral, why we do not sell. Replaces delivery and return pages                                              |
| Despre, Contact, FAQ | unchanged                                                                                               | Copy rewritten                                                                                                                                      |
| Cont                 | `/cont/**`                                                                                              | Overview, Salvate (products, articles, rituals), Urmăresc (topics), Notificări, Rezultate quiz, Recomandări, Date personale, Newsletter, Securitate |
| Legal                | `/termeni-si-conditii`, `/politica-de-confidentialitate`, `/politica-cookies`, `/transparenta-afiliere` | Rewritten                                                                                                                                           |

### 3.2 Navigation

```
Header (desktop)
  Logo · Jurnal · Recenzii · Ritualuri · Produse ▾ · Descoperă ▾ · Despre
        [Caută] [Salvate ♡] [Cont] [ Abonează-te ]   ← the basket icon is gone

  Produse ▾   Uleiuri · Amestecuri · Kituri și pachete · Difuzoare · Accesorii
              (from the database, as today) + "Cum cumpăr de pe doTERRA"
  Descoperă ▾ Quiz aromatic · După nevoie · După categorie

Mobile bottom nav
  Acasă · Jurnal · Caută · Salvate · Cont

Footer
  Newsletter signup (primary)
  Explorează: Jurnal, Recenzii, Ritualuri, Produse, Quiz
  Despre: Despre noi, Cum cumpăr, Contact, Întrebări frecvente
  Legal: Termeni, Confidențialitate, Cookies, Transparență afiliere
  Disclosure line: "Nu vindem produse. Linkurile către doTERRA sunt linkuri de recomandare."
```

### 3.3 The product page

Hero (gallery, name, aroma profile, short description) → **"Cumpără de pe doTERRA ↗"** primary
button with the disclosure under it → Despre produs → Cum îl folosim (rituals) → Recenzia noastră
(if one exists) → Din jurnal → Siguranță → Îți poate plăcea și. The button opens a new tab via our
counter route (section 4.1). The admin will show a "link verificat la" date.

---

## 4. Data model changes

### 4.0 Safe migration rules (every phase)

1. **Backup first.** Before any migration that removes or moves data: `pg_dump -Fc` of the whole
   database (production on Neon + local), plus a Neon branch as a snapshot, plus a CSV export of
   each affected table into `storage/backups/<date>/` (git-ignored). The backup step is written into
   `PROGRESS.md` with file names and row counts before the migration runs.
2. **Expand, then contract.** First add new columns and tables and stop reading the old ones
   (deploy). Remove only in a later phase, after a release has run without them.
3. **Archive, don't drop.** Commerce tables move into a separate Postgres schema
   (`ALTER TABLE orders SET SCHEMA legacy_commerce`). That is instant, keeps every row and is
   reversible; Prisma no longer sees them. A real `DROP` happens only with your explicit approval,
   after the retention period (Q11).
4. **Hand-written SQL** for anything Prisma would generate as a drop/recreate. Every migration is
   reviewed and has a written rollback note.
5. **Production migrations** run through `pnpm db:deploy` on the production Netlify deploy. No
   deploy without your approval.

### 4.1 Outbound purchase link per product

```prisma
model Product {
  // …existing fields…
  /// Full doTERRA referral link for this product, pasted by the admin.
  referralUrl       String?
  /// doTERRA item number (e.g. 60201755), optional.
  doterraItemNumber String?   @unique
  /// When the admin last confirmed `price` against the doTERRA site.
  priceCheckedAt    DateTime?
  /// Last time an admin (or the checker) confirmed the link works.
  linkCheckedAt     DateTime?
  linkStatus        LinkStatus @default(UNCHECKED) // UNCHECKED | OK | BROKEN
}

model OutboundClickDaily {        // aggregate counter, no personal data, no cookie → no consent needed
  productId String
  day       DateTime @db.Date
  source    String   // "product" | "review" | "quiz" | "ritual" | "newsletter"…
  count     Int      @default(0)
  @@id([productId, day, source])
}
```

New `affiliate` SiteSetting: `{ allowedHosts, disclosureShort, disclosureLong }`. The link itself
is stored whole per product (owner decision); a CSV import updates many at once. Links go through `/spre-doterra/[slug]?sursa=…`, which
counts the click and answers with a 302 (`noindex`, disallowed in `robots.txt`). Products without a
valid link show "Link în curând" instead of the button.

### 4.2 Removed and archived commerce data

Migration `…_archive_commerce` (phase 2, after backup):
`CREATE SCHEMA legacy_commerce;` then move `carts`, `cart_items`, `orders`, `order_items`,
`order_addresses`, `order_status_events`, `order_counters`, `coupons`, `coupon_products`,
`coupon_categories`, `coupon_usages`, `addresses` and their enum types. Nothing is dropped. The
foreign key from a kept table (`reviews.orderItemId → order_items`) is dropped; the column keeps its
values so existing "verified purchase" reviews stay marked.

Phase 6 contract migration (after backup): drop `products.compare_at_price` and `stock`.
`price` and `quiz_answers.max_price` stay (owner decision on prices).

### 4.3 Kits and packages

- **Official kits** stay `Product` rows with `productType = KIT` and `KitItem` contents (already
  modelled). They get their own `doterraUrl`.
- **Curated packages** ("Pachetul de seară", "Primii pași") are the owner's suggestions: several
  products, each bought separately on doTERRA. They extend the existing `Collection`:

```prisma
enum CollectionKind { COLLECTION  PACKAGE }
model Collection {
  // …existing fields…
  kind     CollectionKind @default(COLLECTION)
  intro    String?        // Markdown
  routineId String?       // optional "use it with this ritual"
}
model CollectionProduct {
  // …existing fields…
  note     String?        // why this product is in the package
  optional Boolean @default(false)
}
```

`/pachete` lists official kits + packages together, without totals or prices.

### 4.4 Editorial reviews

Reviews are articles with extra structure, so they reuse the journal editor, SEO, cover images,
tags and search:

```prisma
enum ArticleKind { STORY  GUIDE  REVIEW }
model Article {
  // …existing fields…
  kind ArticleKind @default(STORY)
  review ArticleReview?
}
model ArticleReview {
  articleId   String   @id
  productId   String
  /// 1–5, optional: the owner may prefer a verdict without stars.
  rating      Int?
  verdict     String
  pros        String[] @default([])
  cons        String[] @default([])
  testedFor   String?  // "6 săptămâni, seara, în difuzor"
  article Article @relation(fields: [articleId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Restrict)
  @@index([productId])
}
```

Reviews are served at `/recenzii/[slug]`; a REVIEW opened under `/jurnal/[slug]` answers 301 to it.
The existing `isDemo` flag and the no-medical-claims validator (`lib/claims.ts`) also apply here.

### 4.5 Followers and notifications

```prisma
enum FollowTarget { ARTICLE_CATEGORY  TAG  NEED  PRODUCT }
model Follow {
  userId     String
  targetType FollowTarget
  targetId   String
  createdAt  DateTime @default(now())
  @@id([userId, targetType, targetId])
  @@index([targetType, targetId])
}

model SavedArticle { userId String  articleId String  createdAt DateTime @default(now())  @@id([userId, articleId]) }

enum NotificationKind { NEW_ARTICLE  NEW_REVIEW  NEW_RITUAL  PRODUCT_UPDATE  SYSTEM }
model Notification {
  id        String   @id @default(uuid(7))
  userId    String
  kind      NotificationKind
  title     String
  href      String
  entityId  String?
  readAt    DateTime?
  emailedAt DateTime?
  createdAt DateTime @default(now())
  @@index([userId, readAt, createdAt])
}

enum DigestFrequency { OFF  INSTANT  WEEKLY }
model NotificationPreference {
  userId      String @id
  inApp       Boolean @default(true)
  emailDigest DigestFrequency @default(WEEKLY)
  updatedAt   DateTime @updatedAt
}
```

Publishing an article/review/ritual creates notifications for the followers of its category, tags,
needs or product (fan-out in a Server Action after publish, idempotent per `entityId`). Email
digests reuse the email provider and need a consent purpose (Q10). "Follow" for a guest means
"subscribe to the newsletter for this topic", reusing `NewsletterSubscriber.interests`.

### 4.6 Customer reviews (existing `Review` table)

The "verified buyer" rule (`REVIEWABLE_ORDER_STATUSES`) no longer works. Owner decision: reviews
stay open.

- **Phase 2:** any signed-in member with a verified email can write one review per product; it is
  moderated as today and shown without a badge. Reviews that already have `orderItemId` keep the
  "verified purchase" badge.
- **Phase 6:** purchase verification.

```prisma
enum PurchaseVerification { NONE  PENDING  VERIFIED  REJECTED }
model Review {
  // …existing fields…
  /// doTERRA order number given by the customer (never shown publicly).
  doterraOrderNumber   String?
  purchaseVerification PurchaseVerification @default(NONE)
  purchaseVerifiedAt   DateTime?
  purchaseVerifiedById String?
}
```

The admin checks the order number in the doTERRA back office and marks it verified; the badge
"Cumpărare verificată" shows only for VERIFIED. An optional screenshot of the order confirmation is
stored privately (never through the public `/uploads` route) and deleted after the decision. If
the back office can export orders, a CSV import can match order number + email automatically.

---

## 5. Old URLs that need 301 redirects

Next's `permanent: true` sends **308**. For a true 301 the map uses `statusCode: 301` in
`next.config.ts` `redirects()` (the Netlify adapter applies them). Dynamic cases are handled in
the page. Whether this matters depends on how much is indexed today (Q13).

| Old URL                                                 | New URL                           | Code                                          |
| ------------------------------------------------------- | --------------------------------- | --------------------------------------------- |
| `/cos`                                                  | `/favorite` (or `/salvate`)       | 301                                           |
| `/finalizare-comanda`, `/finalizare-comanda/:path*`     | `/produse`                        | 301                                           |
| `/cont/comenzi`, `/cont/comenzi/:numar`                 | `/cont`                           | 301                                           |
| `/cont/adrese`                                          | `/cont/date-personale`            | 301                                           |
| `/livrare-si-retur`                                     | `/cum-cumpar`                     | 301                                           |
| `/politica-de-retur`                                    | `/cum-cumpar`                     | 301                                           |
| `/rutine`, `/rutine/:slug`                              | `/ritualuri`, `/ritualuri/:slug`  | 301 (only if Q5 = rename)                     |
| `/cont/rutine`                                          | `/cont/ritualuri`                 | 301 (only if Q5 = rename)                     |
| `/favorite`                                             | `/salvate`                        | 301 (only if Q6 = rename)                     |
| `/jurnal/:slug` where the article is a REVIEW           | `/recenzii/:slug`                 | 301 (in the page)                             |
| `/produse?…pret_min=…&pret_max=…&sortare=pret-*&stoc=…` | same URL without those parameters | 301 (in the page)                             |
| `/admin/comenzi/**`, `/admin/cupoane/**`                | `/admin`                          | 301 (not indexed; avoids 404s from bookmarks) |
| `/api/plati/netopia/ipn`, `/api/plati/netopia/retur`    | none                              | **410 Gone**                                  |

Unchanged on purpose: `/produse/**`, `/produs/[slug]`, `/jurnal/**`, `/descopera/**`, `/quiz`,
`/despre`, `/contact`, `/intrebari-frecvente`, legal pages (content changes, URLs stay).

---

## 6. Phases

Every phase ends with `pnpm check` (typecheck, lint, format, unit tests), `pnpm test:integration`,
a browser pass on the changed pages, an update to `PROGRESS.md`, and a stop for your review. Commit,
push and deploy happen only when you say so.

### Phase 1: Inspection and plan _(this document)_

### Phase 2: Remove commerce

- Backup (section 4.0), then migration `archive_commerce` (section 4.2).
- Delete the code marked REMOVE in section 2; adapt everything that imported it so nothing shows a
  price, stock, basket or order. Product pages temporarily show no buy button.
- Remove the `shipping`, `payment`, `tax` settings, `NETOPIA_*` env vars, `orders:manage`
  permission, order emails, commerce analytics events, `ar_cart` cookie handling.
- Redirect map (section 5) and the 410 routes. Update robots and sitemap.
- Interim legal fix: remove sales clauses from terms and privacy (full rewrite in phase 4).
- **Done when** a search for `cart|checkout|order|coupon|netopia|price|stock` in `src/` finds only
  intentional leftovers (listed in PROGRESS), and every test passes.

### Phase 3: doTERRA outbound links

- Migration: `doterraUrl`, `doterraItemNumber`, `linkStatus`, `linkCheckedAt`, `OutboundClickDaily`.
- `affiliate` setting + admin form; pure link builder (tested); `/spre-doterra/[slug]` counter route.
- "Cumpără de pe doTERRA" button on product, kit, quiz result, ritual, review and saved pages,
  with disclosure and `rel="sponsored noopener"`.
- Admin: link field per product, "verifică linkul" (HEAD request, server side), list of products
  without a link, click counts on the dashboard.
- Fill the links for the current products (from you, Q1/Q2).

### Phase 4: Restructure and rewrite

- New navigation, header, footer, mobile nav (section 3). New pages `/cum-cumpar`,
  `/transparenta-afiliere`, `/recenzii` (listing; reviews themselves in phase 6).
- Rename routines to rituals if Q5 says so (URLs, labels, admin, redirects).
- Rewrite all copy that assumes selling: home, product sheets, FAQ, about, emails, empty states,
  account. Full legal rewrite (marked for lawyer review).
- `Product` JSON-LD without `Offer`; `Organization` cleanup.

### Phase 5: Colour palette editor

- New `theme` SiteSetting: overrides for the semantic tokens in `globals.css` (paper, surface, ink,
  ink-muted, line, forest, sage, clay, ochre, feedback colours). Defaults are today's values.
- The root layout injects the overrides as CSS variables (with the CSP nonce), so Tailwind classes
  pick them up without a rebuild.
- `/admin/setari/culori`: colour pickers grouped by role, live preview of key components (buttons,
  cards, product card, article, email header), WCAG AA contrast check per text/background pair
  (blocks saving a failing pair), reset to default, saved presets.
- Brevo email layout reads the same palette (keeps emails consistent).

### Phase 6: Products and packages

- Migration: `CollectionKind`, package fields, `ArticleKind`, `ArticleReview`.
- `/pachete` listing and detail; admin package editor (products, notes, optional items, ritual).
- Editorial review editor in `/admin/jurnal` (kind = review: product, verdict, pros/cons, rating);
  `/recenzii/[slug]` page with `Review` JSON-LD; the review block on the product page.
- Customer reviews per Q8.
- Contract migration (after backup): drop `price`/`compareAtPrice`/`stock` (Q3), `maxPrice`,
  `orderItemId`. Product admin cleanup.

### Phase 7: Newsletter rewrite

- New email layout (palette from phase 5), templates for "articol nou", "recenzie nouă", "ritualul
  lunii", and a monthly digest built from published content.
- Campaign composer: pick articles/reviews/rituals → generated HTML for Brevo (keeps D-082 and
  D-084: consent in our DB, Brevo sends designed campaigns once).
- Segments: interests (needs, aromas, followed topics), members vs. guests; remove `customersOnly`.
- Rewrite the `newsletters/brevo/*.html` drafts; retire the coupon campaign.
- Signup points: end of every article, quiz result, `/cum-cumpar`, follow buttons for guests.

### Phase 8: Accounts and audience growth

- Migration: `Follow`, `SavedArticle`, `Notification`, `NotificationPreference`.
- Follow buttons (journal category, tag, need, product), save article, `/cont/urmaresc`,
  `/cont/notificari` with an unread counter in the header, notification fan-out on publish, weekly
  email digest (with consent).
- Account overview shows "nou de când ai fost aici".
- Optional, per Q9: comments on articles (moderated), RSS feed, web push.
- Admin "Audiență": members, subscribers, follows per topic, clicks to doTERRA, best articles.

### Phase 9: Final QA

- Full test pass; new tests for every new service; integration tests for migrations on a copy of
  production data (Neon branch).
- Browser pass on every route (desktop + mobile), accessibility (keyboard, contrast after the
  palette editor), Lighthouse, broken-link check (internal + every doTERRA link).
- Verify all redirects and 410s with `curl -I`; sitemap and robots; structured data validator.
- Copy check: no "comandă", "coș", "livrare", "plată", "preț" left by mistake.
- README, CONTRIBUTING, DECISIONS updated; docs archived. Launch checklist for you.
- Retention decision on `legacy_commerce` (Q11).

---

## 7. Open questions

1. **Referral link format.** What does your doTERRA referral link look like (a personal shop URL,
   a `?OwnerID=`-style parameter, a short `doterra.me/…` link)? Is it the same for every product,
   or do you get a separate link per product?
2. **Product identity.** Should each product use the doTERRA item number as its identifier? Do you
   have a list (name → doTERRA URL → item number) for the current catalogue?
3. **Prices.** Show no price at all (recommended: prices on doTERRA change and differ for
   wholesale/retail), or show an "orientative" price with a date?
4. **doTERRA rules.** Have you checked doTERRA's policies for Wellness Advocate websites (use of
   the brand name and logo, product photos, wording, required disclaimers)? Are the photos in
   `doTerra uleiuri esentiale poze/` cleared for use on the site?
5. **Routines vs. rituals.** Rename "Rutine" to "Ritualuri" everywhere, including URLs (with 301s)?
6. **Favourites.** Keep "Favorite", or rename to "Salvate" and extend it to articles and rituals?
7. **Quick view** on product cards: keep with the outbound button, or remove?
8. **Customer reviews** (section 4.6): option (a) experiences from members, (b) freeze, or (c) hide?
9. **Audience features.** Which of these do you want: follows + in-app notifications (planned),
   weekly email digest (planned), comments, RSS, browser push notifications?
10. **Consent for digests.** Should email digests for followed topics be part of the newsletter
    consent, or a separate opt-in? (Separate is the safer GDPR reading.)
11. **Existing orders and addresses.** Are there real orders, invoices or customer addresses in the
    production database? If yes, how long must your accountant keep them? Until then they stay in
    `legacy_commerce`.
12. **Brands.** doTERRA only, or will other brands appear (as content, without links)?
13. **Is the site live and indexed?** If it is not public yet, the redirect map can be smaller.
14. **Repository layout.** The parent folder is an empty git repo holding the app as a gitlink, and
    the SQL dumps sit untracked at the app root. Can I move the dumps into `storage/` (git-ignored)
    and leave the parent folder alone, or do you want the parent repo removed?
15. **Kits.** Which official doTERRA kits should appear, and do you already have curated packages in
    mind?
16. **Disclosure text.** Do you have the wording for the affiliate disclosure, or should I draft it
    (Romanian, for lawyer review)?
