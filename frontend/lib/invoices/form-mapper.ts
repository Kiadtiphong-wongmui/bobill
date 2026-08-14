import type { InvoiceApi, InvoiceForm } from "./types";

const defaultEmptyLine = { description: "", quantity: 1, unitPrice: 0 };

export const mapInvoiceToForm = (invoice: InvoiceApi): InvoiceForm => ({
  invoiceNumber: invoice.invoiceNumber,
  invoiceNumberPrefix: "",
  documentDate: invoice.documentDate.slice(0, 10),
  paymentTerms: invoice.paymentTerms ?? "",
  creditDays: invoice.creditDays ?? 0,
  sellerCompanyName: invoice.sellerCompanyName,
  sellerAddress: invoice.sellerAddress,
  sellerTaxId: invoice.sellerTaxId ?? "",
  sellerPhone: invoice.sellerPhone ?? "",
  sellerEmail: invoice.sellerEmail ?? "",
  includeBuyer: invoice.includeBuyer !== false,
  buyerCompanyName: invoice.buyerCompanyName ?? "",
  buyerAddress: invoice.buyerAddress ?? "",
  buyerTaxId: invoice.buyerTaxId ?? "",
  discountTotal: Number(invoice.discountTotal),
  amountInWords: invoice.amountInWords ?? "",
  note: invoice.note ?? "",
  signatures: {
    approvedBy: {
      dottedText: invoice.signatures?.approvedBy?.dottedText ?? "",
      bracketText: invoice.signatures?.approvedBy?.bracketText ?? "",
      imageDataUrl: invoice.signatures?.approvedBy?.imageDataUrl ?? "",
    },
    receivedBy: {
      dottedText: invoice.signatures?.receivedBy?.dottedText ?? "",
      bracketText: invoice.signatures?.receivedBy?.bracketText ?? "",
      imageDataUrl: invoice.signatures?.receivedBy?.imageDataUrl ?? "",
    },
    payer: {
      dottedText: invoice.signatures?.payer?.dottedText ?? "",
      bracketText: invoice.signatures?.payer?.bracketText ?? "",
      imageDataUrl: invoice.signatures?.payer?.imageDataUrl ?? "",
    },
  },
  status: invoice.status,
  items: invoice.items.length
    ? invoice.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))
    : [{ ...defaultEmptyLine }],
});
