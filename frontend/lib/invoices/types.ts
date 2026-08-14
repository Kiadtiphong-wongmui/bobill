export type InvoiceLineForm = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type SignatureForm = {
  dottedText: string;
  bracketText: string;
  imageDataUrl: string;
};

export type InvoiceForm = {
  invoiceNumber: string;
  /** Used when invoiceNumber is left blank so the server can auto-generate with this prefix (e.g. RC- or INV-). */
  invoiceNumberPrefix: string;
  documentDate: string;
  paymentTerms: string;
  creditDays: number;
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
  amountInWords: string;
  note: string;
  signatures: {
    approvedBy: SignatureForm;
    receivedBy: SignatureForm;
    payer: SignatureForm;
  };
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  items: InvoiceLineForm[];
};

export type InvoiceApi = {
  id: number;
  invoiceNumber: string;
  documentDate: string;
  paymentTerms: string | null;
  creditDays: number | null;
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
  grandTotal: string;
  amountInWords: string | null;
  note: string | null;
  signatures: {
    approvedBy?: {
      dottedText?: string;
      bracketText?: string;
      imageDataUrl?: string;
    };
    receivedBy?: {
      dottedText?: string;
      bracketText?: string;
      imageDataUrl?: string;
    };
    payer?: {
      dottedText?: string;
      bracketText?: string;
      imageDataUrl?: string;
    };
  } | null;
  status: "DRAFT" | "ISSUED" | "CANCELLED";
  items: Array<{
    lineNo: number;
    description: string;
    quantity: string;
    unitPrice: string;
    lineTotal: string;
  }>;
};

export type InvoiceListResponse = {
  items: InvoiceApi[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};

export type MonthlyStat = {
  year: number;
  month: number;
  monthName: string;
  issuedCount: number;
  draftCount: number;
  cancelledCount: number;
  totalSales: number;
};

export type InvoiceStats = {
  totalSales: number;
  issuedCount: number;
  draftCount: number;
  cancelledCount: number;
  selectedYear: number;
  availableYears: number[];
  monthlyStats: MonthlyStat[];
};
