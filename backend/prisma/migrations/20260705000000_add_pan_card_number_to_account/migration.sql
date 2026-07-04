-- AlterTable
ALTER TABLE "Account" ADD COLUMN "panCardNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Account_panCardNumber_key" ON "Account"("panCardNumber");
