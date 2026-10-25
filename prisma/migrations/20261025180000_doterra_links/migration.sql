-- Phase 3: doTERRA outbound links (docs/PIVOT_PLAN.md § 4.1). Additive only: no data is changed.
--
-- Rollback: DROP TABLE "outbound_clicks_daily";
--           ALTER TABLE "products" DROP COLUMN "priceCheckedAt", DROP COLUMN "referralUrl",
--             DROP COLUMN "doterraItemNumber", DROP COLUMN "linkCheckedAt", DROP COLUMN "linkStatus";
--           DROP TYPE "LinkStatus";

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('UNCHECKED', 'OK', 'BROKEN');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "doterraItemNumber" TEXT,
ADD COLUMN     "linkCheckedAt" TIMESTAMP(3),
ADD COLUMN     "linkStatus" "LinkStatus" NOT NULL DEFAULT 'UNCHECKED',
ADD COLUMN     "priceCheckedAt" TIMESTAMP(3),
ADD COLUMN     "referralUrl" TEXT;

-- CreateTable
CREATE TABLE "outbound_clicks_daily" (
    "productId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "source" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "outbound_clicks_daily_pkey" PRIMARY KEY ("productId","day","source")
);

-- CreateIndex
CREATE INDEX "outbound_clicks_daily_day_idx" ON "outbound_clicks_daily"("day");

-- CreateIndex
CREATE UNIQUE INDEX "products_doterraItemNumber_key" ON "products"("doterraItemNumber");

-- AddForeignKey
ALTER TABLE "outbound_clicks_daily" ADD CONSTRAINT "outbound_clicks_daily_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;


ALTER TABLE "outbound_clicks_daily" ADD CONSTRAINT "outbound_clicks_daily_count_nonnegative" CHECK ("count" >= 0);
