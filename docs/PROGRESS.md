# Progress

## Phase overview

| Phase | Scope                                              | Status  |
| ----- | -------------------------------------------------- | ------- |
| 1     | Inspection, architecture, foundation               | Done    |
| 2     | Design system and global layout                    | Pending |
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
