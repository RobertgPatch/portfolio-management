-- AlterTable: make K1ImportSession.partnershipId nullable
-- This allows uploading K-1 PDFs without a pre-selected partnership.
-- The partnership is resolved from PDF metadata (EIN / name) after extraction.
ALTER TABLE "K1ImportSession" ALTER COLUMN "partnershipId" DROP NOT NULL;

-- Add missing columns that exist in schema but were never migrated
ALTER TABLE "K1ImportSession" ADD COLUMN IF NOT EXISTS "extractionDurationMs" INTEGER;
ALTER TABLE "K1ImportSession" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);
ALTER TABLE "K1ImportSession" ADD COLUMN IF NOT EXISTS "verifiedBy" TEXT;
