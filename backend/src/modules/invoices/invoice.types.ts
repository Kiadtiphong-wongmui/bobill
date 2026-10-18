export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "CANCELLED"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export type InvoiceItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type SignatureInput = {
  dottedText?: string;
  bracketText?: string;
  imageDataUrl?: string;
};

export type InvoiceSignaturesInput = {
  approvedBy?: SignatureInput;
  receivedBy?: SignatureInput;
  payer?: SignatureInput;
};

export type InvoiceInput = {
  invoiceNumber?: string;
  /** When invoiceNumber is empty, used as prefix for auto-generated numbers (format: {prefix}{YYYYMM}-{#####}). */
  invoiceNumberPrefix?: string;
  documentDate: string;
  paymentTerms?: string;
  creditDays?: number;
  sellerCompanyName: string;
  sellerAddress: string;
  sellerTaxId?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  includeBuyer: boolean;
  buyerCompanyName?: string;
  buyerAddress?: string;
  buyerTaxId?: string;
  discountTotal?: number;
  note?: string;
  amountInWords?: string;
  signatures?: InvoiceSignaturesInput;
  status?: InvoiceStatus;
  items: InvoiceItemInput[];
};
