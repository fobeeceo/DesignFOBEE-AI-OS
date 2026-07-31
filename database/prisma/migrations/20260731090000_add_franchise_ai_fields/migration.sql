-- CreateEnum
CREATE TYPE "LeadPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "aiMemo" TEXT,
ADD COLUMN     "aiSummary" TEXT,
ADD COLUMN     "fitScore" INTEGER,
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "priority" "LeadPriority",
ADD COLUMN     "recommendedCases" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "referenceNo" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "leads_referenceNo_key" ON "leads"("referenceNo");

-- CreateIndex
CREATE INDEX "leads_createdAt_idx" ON "leads"("createdAt");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE INDEX "leads_priority_idx" ON "leads"("priority");

-- CreateIndex
CREATE INDEX "leads_preferredRegion_idx" ON "leads"("preferredRegion");
