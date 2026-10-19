import type { QuotationForm } from "./types";

const DEFAULT_VALIDITY_DAYS = 30;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
};

export const defaultEmptyLine = { description: "", quantity: 1, unitPrice: 0 };
export const defaultSignature = { dottedText: "", bracketText: "", imageDataUrl: "" };

export const buildDefaultQuotationForm = (): QuotationForm => ({
  quotationNumber: "",
  quotationNumberPrefix: "",
  documentDate: isoDate(new Date()),
  validUntil: daysFromNow(DEFAULT_VALIDITY_DAYS),
  paymentTerms: "โอนชำระผ่านบัญชี",
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
  vatEnabled: false,
  vatRate: 7,
  note: "",
  signatures: {
    quotedBy: { ...defaultSignature },
    acceptedBy: { ...defaultSignature },
  },
  items: [{ ...defaultEmptyLine }],
});
