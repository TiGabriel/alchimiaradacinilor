-- AlterTable
ALTER TABLE "quiz_answers" ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "maxPrice" INTEGER;

-- AlterTable
ALTER TABLE "quiz_questions" ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "quiz_result_products" ADD COLUMN     "reason" TEXT;

-- CreateTable
CREATE TABLE "quiz_answer_product_types" (
    "answerId" TEXT NOT NULL,
    "productType" "ProductType" NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "quiz_answer_product_types_pkey" PRIMARY KEY ("answerId","productType")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_answers_questionId_key_key" ON "quiz_answers"("questionId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_questions_quizId_key_key" ON "quiz_questions"("quizId", "key");

-- AddForeignKey
ALTER TABLE "quiz_answer_product_types" ADD CONSTRAINT "quiz_answer_product_types_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "quiz_answers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

