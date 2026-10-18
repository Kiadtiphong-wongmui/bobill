import { INVOICE_STATUSES } from "./invoice.types.js";
import type {
  InvoiceInput,
  InvoiceItemInput,
  InvoiceSignaturesInput,
  InvoiceStatus,
  SignatureInput,
} from "./invoice.types.js";

const toNumber = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  return parsed;
};

const parseItem = (item: unknown, index: number): InvoiceItemInput => {
  if (!item || typeof item !== "object") {
    throw new Error(`items[${index}] must be an object`);
  }

  const raw = item as Record<string, unknown>;
  const description = String(raw.description ?? "").trim();
  const quantity = toNumber(raw.quantity, `items[${index}].quantity`);
  const unitPrice = toNumber(raw.unitPrice, `items[${index}].unitPrice`);

  if (description.length === 0) {
    throw new Error(`items[${index}].description is required`);
  }
  if (quantity <= 0) {
    throw new Error(`items[${index}].quantity must be greater than 0`);
  }
  if (unitPrice < 0) {
    throw new Error(`items[${index}].unitPrice must be greater than or equal to 0`);
  }

  return {
    description,
    quantity,
    unitPrice,
  };
};

const parseStatus = (value: unknown): InvoiceStatus | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const status = String(value).toUpperCase();
  if (!INVOICE_STATUSES.includes(status as InvoiceStatus)) {
    throw new Error(`status must be one of: ${INVOICE_STATUSES.join(", ")}`);
  }
  return status as InvoiceStatus;
};

const parseDocumentDate = (value: unknown): string => {
  const dateText = String(value ?? "").trim();
  const parsed = Date.parse(dateText);
  if (Number.isNaN(parsed)) {
    throw new Error("documentDate must be a valid date string");
  }
  return new Date(parsed).toISOString();
};

const parseSignature = (value: unknown): SignatureInput | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "object") {
    throw new Error("signature block must be an object");
  }
  const raw = value as Record<string, unknown>;
  const signature: SignatureInput = {};
  if (raw.dottedText !== undefined) signature.dottedText = String(raw.dottedText).trim();
  if (raw.bracketText !== undefined) signature.bracketText = String(raw.bracketText).trim();
  if (raw.imageDataUrl !== undefined) signature.imageDataUrl = String(raw.imageDataUrl).trim();
  return signature;
};

const parseSignatures = (value: unknown): InvoiceSignaturesInput | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "object") {
    throw new Error("signatures must be an object");
  }
  const raw = value as Record<string, unknown>;
  const signatures: InvoiceSignaturesInput = {};
  const approvedBy = parseSignature(raw.approvedBy);
  const receivedBy = parseSignature(raw.receivedBy);
  const payer = parseSignature(raw.payer);
  if (approvedBy) signatures.approvedBy = approvedBy;
  if (receivedBy) signatures.receivedBy = receivedBy;
  if (payer) signatures.payer = payer;
  return signatures;
};

export const parseInvoiceInput = (value: unknown): InvoiceInput => {
  if (!value || typeof value !== "object") {
    throw new Error("Request body must be an object");
  }

  const raw = value as Record<string, unknown>;
  const itemsRaw = raw.items;
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw new Error("items must be a non-empty array");
  }

  const sellerCompanyName = String(raw.sellerCompanyName ?? "").trim();
  const sellerAddress = String(raw.sellerAddress ?? "").trim();
  const includeBuyer = raw.includeBuyer !== false;
  const buyerCompanyName = String(raw.buyerCompanyName ?? "").trim();
  const buyerAddress = String(raw.buyerAddress ?? "").trim();

  if (!sellerCompanyName) throw new Error("sellerCompanyName is required");
  if (!sellerAddress) throw new Error("sellerAddress is required");
  if (includeBuyer) {
    if (!buyerCompanyName) throw new Error("buyerCompanyName is required when includeBuyer is true");
    if (!buyerAddress) throw new Error("buyerAddress is required when includeBuyer is true");
  }

  const discountTotal = raw.discountTotal === undefined ? 0 : toNumber(raw.discountTotal, "discountTotal");
  if (discountTotal < 0) {
    throw new Error("discountTotal must be greater than or equal to 0");
  }

  const creditDays = raw.creditDays === undefined ? undefined : toNumber(raw.creditDays, "creditDays");
  if (creditDays !== undefined && creditDays < 0) {
    throw new Error("creditDays must be greater than or equal to 0");
  }

  const data: InvoiceInput = {
    documentDate: parseDocumentDate(raw.documentDate),
    sellerCompanyName,
    sellerAddress,
    includeBuyer,
    discountTotal,
    items: itemsRaw.map((item, index) => parseItem(item, index)),
  };

  if (includeBuyer) {
    data.buyerCompanyName = buyerCompanyName;
    data.buyerAddress = buyerAddress;
  }

  if (raw.invoiceNumber !== undefined) data.invoiceNumber = String(raw.invoiceNumber).trim();
  if (raw.invoiceNumberPrefix !== undefined) {
    data.invoiceNumberPrefix = String(raw.invoiceNumberPrefix).trim();
  }
  if (raw.paymentTerms !== undefined) data.paymentTerms = String(raw.paymentTerms).trim();
  if (creditDays !== undefined) data.creditDays = creditDays;
  if (raw.sellerTaxId !== undefined) data.sellerTaxId = String(raw.sellerTaxId).trim();
  if (raw.sellerPhone !== undefined) data.sellerPhone = String(raw.sellerPhone).trim();
  if (raw.sellerEmail !== undefined) data.sellerEmail = String(raw.sellerEmail).trim();
  if (includeBuyer && raw.buyerTaxId !== undefined) data.buyerTaxId = String(raw.buyerTaxId).trim();
  if (raw.note !== undefined) data.note = String(raw.note).trim();
  if (raw.amountInWords !== undefined) data.amountInWords = String(raw.amountInWords).trim();
  const signatures = parseSignatures(raw.signatures);
  if (signatures !== undefined) data.signatures = signatures;
  const status = parseStatus(raw.status);
  if (status !== undefined) data.status = status;

  return data;
};
