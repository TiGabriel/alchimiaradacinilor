# Progress

## Phase overview

| Phase | Scope                                              | Status  |
| ----- | -------------------------------------------------- | ------- |
| 1     | Inspection, architecture, foundation               | Done    |
| 2     | Design system and global layout                    | Done    |
| 3     | Catalog, product page, search                      | Pending |
| 4     | Cart and wishlist                                  | Pending |
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
