import type { InvoiceForm } from "./types";
import { defaultSignature } from "./default-invoice-form";

export const INVOICE_NEW_DEFAULTS_STORAGE_KEY = "bobill_invoice_new_defaults_v1";

export type InvoiceNewDefaultsStored = Partial<{
  invoiceNumberPrefix: string;
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
  items: InvoiceForm["items"];
  signatures: InvoiceForm["signatures"];
}>;

function readRaw(): InvoiceNewDefaultsStored {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(INVOICE_NEW_DEFAULTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as InvoiceNewDefaultsStored;
  } catch {
    return {};
  }
}

function writeRaw(data: InvoiceNewDefaultsStored) {
  if (typeof window === "undefined") return;
  localStorage.setItem(INVOICE_NEW_DEFAULTS_STORAGE_KEY, JSON.stringify(data));
}

export function loadInvoiceNewDefaults(): InvoiceNewDefaultsStored {
  return readRaw();
}

function normalizeItems(items: InvoiceForm["items"] | undefined): InvoiceForm["items"] | undefined {
  if (!items?.length) return undefined;
  return items.map((line) => ({
    description: String(line.description ?? ""),
    quantity: typeof line.quantity === "number" && line.quantity > 0 ? line.quantity : 1,
    unitPrice: typeof line.unitPrice === "number" && line.unitPrice >= 0 ? line.unitPrice : 0,
  }));
}

function mergeSignatures(
  base: InvoiceForm["signatures"],
  stored?: InvoiceForm["signatures"],
): InvoiceForm["signatures"] {
  if (!stored) return base;
  const block = (key: keyof InvoiceForm["signatures"]) => ({
    ...defaultSignature,
    ...base[key],
    ...stored[key],
  });
  return {
    approvedBy: block("approvedBy"),
    receivedBy: block("receivedBy"),
    payer: block("payer"),
  };
}

/** Merge saved defaults onto a freshly built form (e.g. new document date). */
export function mergeDefaultsIntoForm(base: InvoiceForm): InvoiceForm {
  const s = typeof window !== "undefined" ? readRaw() : {};
  const items = normalizeItems(s.items) ?? base.items;
  return {
    ...base,
    invoiceNumberPrefix: s.invoiceNumberPrefix ?? base.invoiceNumberPrefix,
    paymentTerms: s.paymentTerms ?? base.paymentTerms,
    creditDays: s.creditDays ?? base.creditDays,
    sellerCompanyName: s.sellerCompanyName ?? base.sellerCompanyName,
    sellerAddress: s.sellerAddress ?? base.sellerAddress,
    sellerTaxId: s.sellerTaxId ?? base.sellerTaxId,
    sellerPhone: s.sellerPhone ?? base.sellerPhone,
    sellerEmail: s.sellerEmail ?? base.sellerEmail,
    includeBuyer: s.includeBuyer ?? base.includeBuyer,
    buyerCompanyName: s.buyerCompanyName ?? base.buyerCompanyName,
    buyerAddress: s.buyerAddress ?? base.buyerAddress,
    buyerTaxId: s.buyerTaxId ?? base.buyerTaxId,
    items,
    signatures: mergeSignatures(base.signatures, s.signatures),
  };
}

export type InvoiceDefaultsSection = "document" | "seller" | "buyer" | "items" | "signatures" | "all";

export function saveInvoiceNewDefaults(section: InvoiceDefaultsSection, form: InvoiceForm) {
  const prev = readRaw();
  const next: InvoiceNewDefaultsStored = { ...prev };

  const applyDocument = () => {
    next.invoiceNumberPrefix = form.invoiceNumberPrefix;
    next.paymentTerms = form.paymentTerms;
    next.creditDays = form.creditDays;
  };
  const applySeller = () => {
    next.sellerCompanyName = form.sellerCompanyName;
    next.sellerAddress = form.sellerAddress;
    next.sellerTaxId = form.sellerTaxId;
    next.sellerPhone = form.sellerPhone;
    next.sellerEmail = form.sellerEmail;
  };
  const applyBuyer = () => {
    next.includeBuyer = form.includeBuyer;
    next.buyerCompanyName = form.buyerCompanyName;
    next.buyerAddress = form.buyerAddress;
    next.buyerTaxId = form.buyerTaxId;
  };
  const applyItems = () => {
    next.items = form.items.map((line) => ({ ...line }));
  };
  const applySignatures = () => {
    next.signatures = {
      approvedBy: { ...form.signatures.approvedBy },
      receivedBy: { ...form.signatures.receivedBy },
      payer: { ...form.signatures.payer },
    };
  };

  switch (section) {
    case "document":
      applyDocument();
      break;
    case "seller":
      applySeller();
      break;
    case "buyer":
      applyBuyer();
      break;
    case "items":
      applyItems();
      break;
    case "signatures":
      applySignatures();
      break;
    case "all":
      applyDocument();
      applySeller();
      applyBuyer();
      applyItems();
      applySignatures();
      break;
    default:
      break;
  }

  writeRaw(next);
}
