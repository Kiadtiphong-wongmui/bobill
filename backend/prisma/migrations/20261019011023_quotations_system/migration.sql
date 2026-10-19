-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "Quotation" (
    "id" SERIAL NOT NULL,
    "quotationNumber" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "paymentTerms" TEXT,
    "sellerCompanyName" TEXT NOT NULL,
    "sellerAddress" TEXT NOT NULL,
    "sellerTaxId" TEXT,
    "sellerPhone" TEXT,
    "sellerEmail" TEXT,
    "includeBuyer" BOOLEAN NOT NULL DEFAULT true,
    "buyerCompanyName" TEXT,
    "buyerAddress" TEXT,
    "buyerTaxId" TEXT,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "vatEnabled" BOOLEAN NOT NULL DEFAULT false,
    "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 7,
    "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "amountInWords" TEXT,
    "signatures" JSONB,
    "status" "QuotationStatus" NOT NULL DEFAULT 'DRAFT',
    "convertedInvoiceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationItem" (
    "id" SERIAL NOT NULL,
    "quotationId" INTEGER NOT NULL,
    "lineNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(12,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuotationItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_quotationNumber_key" ON "Quotation"("quotationNumber");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE INDEX "Quotation_documentDate_idx" ON "Quotation"("documentDate");

-- CreateIndex
CREATE INDEX "QuotationItem_quotationId_idx" ON "QuotationItem"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "QuotationItem_quotationId_lineNo_key" ON "QuotationItem"("quotationId", "lineNo");

-- AddForeignKey
ALTER TABLE "QuotationItem" ADD CONSTRAINT "QuotationItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
