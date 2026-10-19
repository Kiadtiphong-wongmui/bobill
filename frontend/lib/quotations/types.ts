export type QuotationStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export type QuotationLineForm = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type SignatureForm = {
  dottedText: string;
  bracketText: string;
  imageDataUrl: string;
};

export type QuotationForm = {
  quotationNumber: string;
  /** Used when quotationNumber is left blank so the server can auto-generate with this prefix (e.g. QT-). */
  quotationNumberPrefix: string;
  documentDate: string;
  validUntil: string;
  paymentTerms: string;
  sellerCompanyName: string;
  sellerAddress: string;
  sellerTaxId: string;
  sellerPhone: string;
  sellerEmail: string;
  includeBuyer: boolean;
  buyerCompanyName: string;
  buyerAddress: string;
  buyerTaxId: string;
  discountTotal: number;
  vatEnabled: boolean;
  vatRate: number;
  note: string;
  signatures: {
    quotedBy: SignatureForm;
    acceptedBy: SignatureForm;
  };
  items: QuotationLineForm[];
};

type SignatureApi = {
  dottedText?: string;
  bracketText?: string;
  imageDataUrl?: string;
};

export type QuotationApi = {
  id: number;
  quotationNumber: string;
  documentDate: string;
  validUntil: string;
  paymentTerms: string | null;
  sellerCompanyName: string;
  sellerAddress: string;
  sellerTaxId: string | null;
  sellerPhone: string | null;
  sellerEmail: string | null;
  includeBuyer?: boolean;
  buyerCompanyName: string | null;
  buyerAddress: string | null;
  buyerTaxId: string | null;
  subtotal: string;
  discountTotal: string;
  vatEnabled: boolean;
  vatRate: string;
  vatAmount: string;
  grandTotal: string;
  amountInWords: string | null;
  note: string | null;
  signatures: {
    quotedBy?: SignatureApi;
    acceptedBy?: SignatureApi;
  } | null;
  status: QuotationStatus;
  convertedInvoiceId: number | null;
  items: Array<{
    lineNo: number;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
};

export type QuotationListResponse = {
  items: QuotationApi[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type QuotationStatusCounts = Record<QuotationStatus, number>;

export type QuotationMonthlyStat = {
  year: number;
  month: number;
  monthName: string;
  counts: QuotationStatusCounts;
  totalAccepted: number;
};

export type QuotationStats = {
  totalAccepted: number;
  counts: QuotationStatusCounts;
  selectedYear: number;
  availableYears: number[];
  monthlyStats: QuotationMonthlyStat[];
};

export type ConvertToInvoiceResult = {
  quotation: QuotationApi;
  invoice: { id: number; invoiceNumber: string };
};
