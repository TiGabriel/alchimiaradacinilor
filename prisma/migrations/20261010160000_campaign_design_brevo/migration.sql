-- Designed newsletter campaigns sent through Brevo: the HTML and the Brevo campaign id.
-- AlterTable
ALTER TABLE "newsletter_campaigns" ADD COLUMN     "brevoCampaignId" INTEGER,
ADD COLUMN     "html" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_campaigns_brevoCampaignId_key" ON "newsletter_campaigns"("brevoCampaignId");
