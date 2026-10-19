import { normalizeInvoicePrefixStem } from "@/lib/invoices/invoice-prefix";

import type {
  ConvertToInvoiceResult,
  QuotationApi,
  QuotationForm,
  QuotationListResponse,
  QuotationStats,
  QuotationStatus,
} from "./types";

export const toQuotationPayload = (form: QuotationForm) => ({
  quotationNumber: form.quotationNumber.trim() || undefined,
  quotationNumberPrefix: form.quotationNumber.trim()
    ? undefined
    : normalizeInvoicePrefixStem(form.quotationNumberPrefix) || undefined,
  documentDate: form.documentDate,
  validUntil: form.validUntil,
  paymentTerms: form.paymentTerms.trim() || undefined,
  sellerCompanyName: form.sellerCompanyName.trim(),
  sellerAddress: form.sellerAddress.trim(),
  sellerTaxId: form.sellerTaxId.trim() || undefined,
  sellerPhone: form.sellerPhone.trim() || undefined,
  sellerEmail: form.sellerEmail.trim() || undefined,
  includeBuyer: form.includeBuyer,
  buyerCompanyName: form.includeBuyer ? form.buyerCompanyName.trim() : undefined,
  buyerAddress: form.includeBuyer ? form.buyerAddress.trim() : undefined,
  buyerTaxId: form.includeBuyer ? form.buyerTaxId.trim() || undefined : undefined,
  discountTotal: form.discountTotal,
  vatEnabled: form.vatEnabled,
  vatRate: form.vatRate,
  note: form.note.trim() || undefined,
  signatures: form.signatures,
  items: form.items.map((item) => ({
    description: item.description.trim(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  })),
});

/** Parses a response, throwing the backend `message` when the request failed. */
async function parse<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? fallback);
  }
  return payload;
}

const jsonInit = (method: string, form: QuotationForm): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(toQuotationPayload(form)),
});

export const createQuotation = async (form: QuotationForm): Promise<QuotationApi> =>
  parse(await fetch("/api/quotations", jsonInit("POST", form)), "Unable to create quotation");

export const updateQuotation = async (id: number, form: QuotationForm): Promise<QuotationApi> =>
  parse(await fetch(`/api/quotations/${id}`, jsonInit("PUT", form)), "Unable to update quotation");

export const getQuotation = async (id: number): Promise<QuotationApi> =>
  parse(await fetch(`/api/quotations/${id}`, { cache: "no-store" }), "Unable to load quotation");

export const listQuotations = async (query: {
  page?: number;
  pageSize?: number;
  q?: string;
  seller?: string;
  buyer?: string;
  status?: QuotationStatus | "ALL";
  from?: string;
  to?: string;
  sortBy?: "number" | "date" | "amount" | "seller" | "buyer" | "validUntil";
  sortDir?: "asc" | "desc";
}): Promise<QuotationListResponse> => {
  const params = new URLSearchParams();
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  if (query.q?.trim()) params.set("q", query.q.trim());
  if (query.seller?.trim()) params.set("seller", query.seller.trim());
  if (query.buyer?.trim()) params.set("buyer", query.buyer.trim());
  if (query.status && query.status !== "ALL") params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.sortBy) params.set("sortBy", query.sortBy);
  if (query.sortDir) params.set("sortDir", query.sortDir);

  return parse(await fetch(`/api/quotations?${params.toString()}`, { cache: "no-store" }), "Unable to load quotations");
};

export const listRecentQuotations = async (limit = 5): Promise<QuotationApi[]> =>
  parse(await fetch(`/api/quotations/recent?limit=${limit}`, { cache: "no-store" }), "Unable to load recent quotations");

export const getQuotationStats = async (year?: number): Promise<QuotationStats> =>
  parse(
    await fetch(`/api/quotations/stats${year ? `?year=${year}` : ""}`, { cache: "no-store" }),
    "Unable to load quotation statistics",
  );

const patchAction = async (id: number, action: "send" | "accept" | "reject"): Promise<QuotationApi> =>
  parse(await fetch(`/api/quotations/${id}?action=${action}`, { method: "PATCH" }), `Unable to ${action} quotation`);

export const sendQuotation = (id: number) => patchAction(id, "send");
export const acceptQuotation = (id: number) => patchAction(id, "accept");
export const rejectQuotation = (id: number) => patchAction(id, "reject");

export const convertQuotationToInvoice = async (id: number): Promise<ConvertToInvoiceResult> =>
  parse(await fetch(`/api/quotations/${id}/convert`, { method: "POST" }), "Unable to convert quotation to invoice");

export const deleteQuotation = async (id: number): Promise<void> => {
  const response = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const payload = (await response.json()) as { message?: string };
    throw new Error(payload.message ?? "Unable to delete quotation");
  }
};
