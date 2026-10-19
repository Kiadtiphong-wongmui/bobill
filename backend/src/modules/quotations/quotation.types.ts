export const QUOTATION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const;

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export type QuotationItemInput = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type SignatureInput = {
  dottedText?: string;
  bracketText?: string;
  imageDataUrl?: string;
};

export type QuotationSignaturesInput = {
  quotedBy?: SignatureInput;
  acceptedBy?: SignatureInput;
};

export type QuotationInput = {
  quotationNumber?: string;
  /** When quotationNumber is empty, used as prefix for auto-generated numbers (format: {prefix}{YYYYMM}-{#####}). */
  quotationNumberPrefix?: string;
  documentDate: string;
  validUntil: string;
  paymentTerms?: string;
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
  vatEnabled: boolean;
  vatRate: number;
  note?: string;
  signatures?: QuotationSignaturesInput;
  items: QuotationItemInput[];
};

/** Allowed status transitions. Everything else is rejected by the service. */
export const QUOTATION_TRANSITIONS: Record<QuotationStatus, readonly QuotationStatus[]> = {
  DRAFT: ["SENT"],
  SENT: ["ACCEPTED", "REJECTED", "EXPIRED"],
  ACCEPTED: [],
  REJECTED: [],
  EXPIRED: [],
};
