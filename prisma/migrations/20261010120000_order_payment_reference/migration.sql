-- Card payments (NETOPIA): which processor handled the order and its transaction id.
-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "paymentReference" TEXT;
