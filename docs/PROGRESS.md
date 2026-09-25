# Progress

## Phase overview

| Phase | Scope                                              | Status  |
| ----- | -------------------------------------------------- | ------- |
| 1     | Inspection, architecture, foundation               | Done    |
| 2     | Design system and global layout                    | Done    |
| 3     | Catalog, product page, search                      | Done    |
| 4     | Cart and wishlist                                  | Done    |
| 5     | Authentication and roles (+ cart/wishlist merge)   | Pending |
| 6+    | Checkout, quiz, routines, journal, account, admin… | Pending |

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
