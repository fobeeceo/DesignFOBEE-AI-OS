-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "consultationPurpose" TEXT,
ADD COLUMN     "currentOccupation" TEXT,
ADD COLUMN     "expectedInvestment" TEXT,
ADD COLUMN     "hasStorefront" BOOLEAN,
ADD COLUMN     "plannedTiming" TEXT,
ADD COLUMN     "preferredRegion" TEXT,
ADD COLUMN     "privacyConsent" BOOLEAN NOT NULL DEFAULT false;
