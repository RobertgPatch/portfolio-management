-- CreateEnum: K1FormType (referenced by KDocument.formType)
CREATE TYPE "K1FormType" AS ENUM ('F1065', 'F1120S', 'F1041');

-- AlterTable: add missing columns to KDocument
ALTER TABLE "KDocument" ADD COLUMN IF NOT EXISTS "formType" "K1FormType" NOT NULL DEFAULT 'F1065';
ALTER TABLE "KDocument" ADD COLUMN IF NOT EXISTS "isAmended" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KDocument" ADD COLUMN IF NOT EXISTS "isFinal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "KDocument" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "KDocument_formType_idx" ON "KDocument"("formType");
