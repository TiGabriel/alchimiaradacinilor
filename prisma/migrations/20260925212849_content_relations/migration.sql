-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "authorName" TEXT;

-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "frequency" TEXT;

-- CreateTable
CREATE TABLE "routine_tags" (
    "routineId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "routine_tags_pkey" PRIMARY KEY ("routineId","tagId")
);

-- CreateTable
CREATE TABLE "article_routines" (
    "articleId" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "article_routines_pkey" PRIMARY KEY ("articleId","routineId")
);

-- CreateTable
CREATE TABLE "article_tags" (
    "articleId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "article_tags_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateIndex
CREATE INDEX "routine_tags_tagId_idx" ON "routine_tags"("tagId");

-- CreateIndex
CREATE INDEX "article_routines_routineId_idx" ON "article_routines"("routineId");

-- CreateIndex
CREATE INDEX "article_tags_tagId_idx" ON "article_tags"("tagId");

-- AddForeignKey
ALTER TABLE "routine_tags" ADD CONSTRAINT "routine_tags_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_tags" ADD CONSTRAINT "routine_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_routines" ADD CONSTRAINT "article_routines_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_routines" ADD CONSTRAINT "article_routines_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "article_tags" ADD CONSTRAINT "article_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

