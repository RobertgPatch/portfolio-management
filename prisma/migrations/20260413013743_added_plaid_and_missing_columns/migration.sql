-- CreateTable (PlaidItem)
CREATE TABLE IF NOT EXISTS "PlaidItem" (
    "accessToken" TEXT NOT NULL,
    "consentExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cursor" TEXT,
    "error" TEXT,
    "id" TEXT NOT NULL,
    "institutionId" TEXT,
    "institutionName" TEXT,
    "itemId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PlaidItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PlaidItem_itemId_key" ON "PlaidItem"("itemId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlaidItem_userId_idx" ON "PlaidItem"("userId");

-- AddForeignKey (PlaidItem → User)
ALTER TABLE "PlaidItem"
  DROP CONSTRAINT IF EXISTS "PlaidItem_userId_fkey";
ALTER TABLE "PlaidItem"
  ADD CONSTRAINT "PlaidItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable (Account: add accountType, plaidAccountId, plaidItemId)
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "accountType" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "plaidAccountId" TEXT;
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "plaidItemId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Account_plaidItemId_idx" ON "Account"("plaidItemId");

-- AddForeignKey (Account → PlaidItem)
ALTER TABLE "Account"
  DROP CONSTRAINT IF EXISTS "Account_plaidItemId_fkey";
ALTER TABLE "Account"
  ADD CONSTRAINT "Account_plaidItemId_fkey"
  FOREIGN KEY ("plaidItemId") REFERENCES "PlaidItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable (Partnership: add ein)
ALTER TABLE "Partnership" ADD COLUMN IF NOT EXISTS "ein" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Partnership_ein_key" ON "Partnership"("ein");
