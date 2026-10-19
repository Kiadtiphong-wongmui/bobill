import { defaultEmptyLine } from "./default-quotation-form";
import type { QuotationApi, QuotationForm } from "./types";

const mapSignature = (signature?: { dottedText?: string; bracketText?: string; imageDataUrl?: string }) => ({
  dottedText: signature?.dottedText ?? "",
  bracketText: signature?.bracketText ?? "",
  imageDataUrl: signature?.imageDataUrl ?? "",
});

export const mapQuotationToForm = (quotation: QuotationApi): QuotationForm => ({
  quotationNumber: quotation.quotationNumber,
  quotationNumberPrefix: "",
  documentDate: quotation.documentDate.slice(0, 10),
  validUntil: quotation.validUntil.slice(0, 10),
  paymentTerms: quotation.paymentTerms ?? "",
  sellerCompanyName: quotation.sellerCompanyName,
  sellerAddress: quotation.sellerAddress,
  sellerTaxId: quotation.sellerTaxId ?? "",
  sellerPhone: quotation.sellerPhone ?? "",
  sellerEmail: quotation.sellerEmail ?? "",
  includeBuyer: quotation.includeBuyer !== false,
  buyerCompanyName: quotation.buyerCompanyName ?? "",
  buyerAddress: quotation.buyerAddress ?? "",
  buyerTaxId: quotation.buyerTaxId ?? "",
  discountTotal: Number(quotation.discountTotal),
  vatEnabled: quotation.vatEnabled,
  vatRate: Number(quotation.vatRate),
  note: quotation.note ?? "",
  signatures: {
    quotedBy: mapSignature(quotation.signatures?.quotedBy),
    acceptedBy: mapSignature(quotation.signatures?.acceptedBy),
  },
  items: quotation.items.length
    ? quotation.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))
    : [{ ...defaultEmptyLine }],
});
