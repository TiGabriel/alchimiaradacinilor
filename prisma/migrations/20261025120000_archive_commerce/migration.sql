-- The site no longer sells: products are bought on doTERRA through referral links.
-- The shop tables are moved, with every row, into the `legacy_commerce` schema. Prisma only
-- manages `public`, so they leave the data model without being dropped (docs/PIVOT_PLAN.md § 4.2).
-- Take a backup first (pg_dump + CSV per table, logged in docs/PROGRESS.md).
--
-- Rollback: move each table and type back with `ALTER … SET SCHEMA public`, re-add
-- "reviews_orderItemId_fkey" (see the init migration) and restore the previous schema.prisma.

CREATE SCHEMA IF NOT EXISTS "legacy_commerce";

-- The only link from a kept table: reviews keep their orderItemId values (verified-buyer history).
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_orderItemId_fkey";

-- Tables (indexes, CHECK and foreign key constraints move with them).
ALTER TABLE "cart_items" SET SCHEMA "legacy_commerce";
ALTER TABLE "carts" SET SCHEMA "legacy_commerce";
ALTER TABLE "coupon_usages" SET SCHEMA "legacy_commerce";
ALTER TABLE "coupon_products" SET SCHEMA "legacy_commerce";
ALTER TABLE "coupon_categories" SET SCHEMA "legacy_commerce";
ALTER TABLE "order_status_events" SET SCHEMA "legacy_commerce";
ALTER TABLE "order_addresses" SET SCHEMA "legacy_commerce";
ALTER TABLE "order_items" SET SCHEMA "legacy_commerce";
ALTER TABLE "orders" SET SCHEMA "legacy_commerce";
ALTER TABLE "order_counters" SET SCHEMA "legacy_commerce";
ALTER TABLE "coupons" SET SCHEMA "legacy_commerce";
ALTER TABLE "addresses" SET SCHEMA "legacy_commerce";

-- Enum types used only by those tables.
ALTER TYPE "OrderStatus" SET SCHEMA "legacy_commerce";
ALTER TYPE "PaymentStatus" SET SCHEMA "legacy_commerce";
ALTER TYPE "PaymentMethod" SET SCHEMA "legacy_commerce";
ALTER TYPE "AddressType" SET SCHEMA "legacy_commerce";
ALTER TYPE "CouponType" SET SCHEMA "legacy_commerce";
