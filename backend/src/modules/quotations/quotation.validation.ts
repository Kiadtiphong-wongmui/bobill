import type {
  QuotationInput,
  QuotationItemInput,
  QuotationSignaturesInput,
  SignatureInput,
} from "./quotation.types.js";

const toNumber = (value: unknown, fieldName: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid number`);
  }
  return parsed;
};

const parseItem = (item: unknown, index: number): QuotationItemInput => {
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

  return { description, quantity, unitPrice };
};

const parseDate = (value: unknown, fieldName: string): string => {
  const parsed = Date.parse(String(value ?? "").trim());
  if (Number.isNaN(parsed)) {
    throw new Error(`${fieldName} must be a valid date string`);
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

const parseSignatures = (value: unknown): QuotationSignaturesInput | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== "object") {
    throw new Error("signatures must be an object");
  }
  const raw = value as Record<string, unknown>;
  const signatures: QuotationSignaturesInput = {};
  const quotedBy = parseSignature(raw.quotedBy);
  const acceptedBy = parseSignature(raw.acceptedBy);
  if (quotedBy) signatures.quotedBy = quotedBy;
  if (acceptedBy) signatures.acceptedBy = acceptedBy;
  return signatures;
};

/**
 * Validates a quotation request body. `status` is intentionally ignored:
 * status only changes through the dedicated transition endpoints.
 */
export const parseQuotationInput = (value: unknown): QuotationInput => {
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

  const vatEnabled = raw.vatEnabled === true;
  const vatRate = raw.vatRate === undefined ? 7 : toNumber(raw.vatRate, "vatRate");
  if (vatRate < 0 || vatRate > 100) {
    throw new Error("vatRate must be between 0 and 100");
  }

  const documentDate = parseDate(raw.documentDate, "documentDate");
  const validUntil = parseDate(raw.validUntil, "validUntil");
  if (new Date(validUntil).getTime() < new Date(documentDate).getTime()) {
    throw new Error("validUntil must not be earlier than documentDate");
  }

  const data: QuotationInput = {
    documentDate,
    validUntil,
    sellerCompanyName,
    sellerAddress,
    includeBuyer,
    discountTotal,
    vatEnabled,
    vatRate,
    items: itemsRaw.map((item, index) => parseItem(item, index)),
  };

  if (includeBuyer) {
    data.buyerCompanyName = buyerCompanyName;
    data.buyerAddress = buyerAddress;
  }

  if (raw.quotationNumber !== undefined) data.quotationNumber = String(raw.quotationNumber).trim();
  if (raw.quotationNumberPrefix !== undefined) {
    data.quotationNumberPrefix = String(raw.quotationNumberPrefix).trim();
  }
  if (raw.paymentTerms !== undefined) data.paymentTerms = String(raw.paymentTerms).trim();
  if (raw.sellerTaxId !== undefined) data.sellerTaxId = String(raw.sellerTaxId).trim();
  if (raw.sellerPhone !== undefined) data.sellerPhone = String(raw.sellerPhone).trim();
  if (raw.sellerEmail !== undefined) data.sellerEmail = String(raw.sellerEmail).trim();
  if (includeBuyer && raw.buyerTaxId !== undefined) data.buyerTaxId = String(raw.buyerTaxId).trim();
  if (raw.note !== undefined) data.note = String(raw.note).trim();
  const signatures = parseSignatures(raw.signatures);
  if (signatures !== undefined) data.signatures = signatures;

  return data;
};
