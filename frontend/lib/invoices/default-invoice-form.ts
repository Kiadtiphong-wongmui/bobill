import type { InvoiceForm } from "./types";

const today = () => new Date().toISOString().slice(0, 10);

export const defaultEmptyLine = { description: "", quantity: 1, unitPrice: 0 };
export const defaultSignature = { dottedText: "", bracketText: "", imageDataUrl: "" };

export const buildDefaultInvoiceForm = (): InvoiceForm => ({
  invoiceNumber: "",
  invoiceNumberPrefix: "",
  documentDate: today(),
  paymentTerms: "โอนชำระผ่านบัญชี",
  creditDays: 0,
  sellerCompanyName: "บริษัท ตัวอย่าง จำกัด",
  sellerAddress: "ที่อยู่ผู้ขาย",
  sellerTaxId: "",
  sellerPhone: "",
  sellerEmail: "",
  includeBuyer: true,
  buyerCompanyName: "ลูกค้า",
  buyerAddress: "ที่อยู่ลูกค้า",
  buyerTaxId: "",
  discountTotal: 0,
  amountInWords: "",
  note: "",
  signatures: {
    approvedBy: { ...defaultSignature },
    receivedBy: { ...defaultSignature },
    payer: { ...defaultSignature },
  },
  status: "DRAFT",
  items: [{ ...defaultEmptyLine }],
});

/** Singleton-style default for modules that should share one object shape (fresh date each call uses buildDefaultInvoiceForm). */
export const defaultInvoiceForm: InvoiceForm = buildDefaultInvoiceForm();
