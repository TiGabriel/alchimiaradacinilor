/*
  Warnings:

  - You are about to drop the column `emailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "ConsentPurpose" ADD VALUE 'PERSONALIZATION';

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerified",
DROP COLUMN "name",
ADD COLUMN     "emailVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastName" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "verifications_value_idx" ON "verifications"("value");

-- Emails are normalised to lower case by the application; enforce it so the
-- unique index is effectively case-insensitive.
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_email_lowercase" CHECK ("email" = lower("email"));
