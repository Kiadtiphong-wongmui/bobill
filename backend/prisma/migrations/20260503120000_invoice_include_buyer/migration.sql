-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "includeBuyer" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Invoice" ALTER COLUMN "buyerCompanyName" DROP NOT NULL;
ALTER TABLE "Invoice" ALTER COLUMN "buyerAddress" DROP NOT NULL;
