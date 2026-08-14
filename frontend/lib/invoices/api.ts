import { normalizeInvoicePrefixStem } from "./invoice-prefix";
import { InvoiceApi, InvoiceForm, InvoiceListResponse, InvoiceStats } from "./types";

export const toInvoicePayload = (form: InvoiceForm) => ({
  invoiceNumber: form.invoiceNumber.trim() || undefined,
  invoiceNumberPrefix:
    form.invoiceNumber.trim()
      ? undefined
      : normalizeInvoicePrefixStem(form.invoiceNumberPrefix) || undefined,
  documentDate: form.documentDate,
  paymentTerms: form.paymentTerms.trim() || undefined,
  creditDays: form.creditDays,
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
  amountInWords: form.amountInWords.trim() || undefined,
  note: form.note.trim() || undefined,
  signatures: form.signatures,
  status: form.status,
  items: form.items.map((item) => ({
    description: item.description.trim(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
  })),
});

export const createInvoice = async (form: InvoiceForm): Promise<InvoiceApi> => {
  const response = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toInvoicePayload(form)),
  });
  const payload = (await response.json()) as InvoiceApi & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to create invoice");
  }
  return payload;
};

export const updateInvoice = async (id: number, form: InvoiceForm): Promise<InvoiceApi> => {
  const response = await fetch(`/api/invoices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toInvoicePayload(form)),
  });
  const payload = (await response.json()) as InvoiceApi & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to update invoice");
  }
  return payload;
};

export const getInvoice = async (id: number): Promise<InvoiceApi> => {
  const response = await fetch(`/api/invoices/${id}`, { cache: "no-store" });
  const payload = (await response.json()) as InvoiceApi & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to load invoice");
  }
  return payload;
};

export const listInvoices = async (query: {
  page?: number;
  pageSize?: number;
  q?: string;
  seller?: string;
  buyer?: string;
  status?: "DRAFT" | "ISSUED" | "CANCELLED" | "ALL";
  from?: string;
  to?: string;
  sortBy?: "number" | "date" | "amount" | "seller" | "buyer";
  sortDir?: "asc" | "desc";
}): Promise<InvoiceListResponse> => {
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

  const response = await fetch(`/api/invoices?${params.toString()}`, { cache: "no-store" });
  const payload = (await response.json()) as InvoiceListResponse & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to load invoices");
  }
  return payload;
};

export const cancelInvoice = async (id: number): Promise<InvoiceApi> => {
  const response = await fetch(`/api/invoices/${id}`, {
    method: "DELETE",
  });
  const payload = (await response.json()) as InvoiceApi & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to cancel invoice");
  }
  return payload;
};

export const listRecentInvoices = async (limit = 5): Promise<InvoiceApi[]> => {
  const response = await fetch(`/api/invoices/recent?limit=${limit}`, { cache: "no-store" });
  const payload = (await response.json()) as InvoiceApi[] & { message?: string };
  if (!response.ok) {
    throw new Error((payload as { message?: string }).message ?? "Unable to load recent invoices");
  }
  return payload as InvoiceApi[];
};

export const issueInvoice = async (id: number): Promise<InvoiceApi> => {
  const response = await fetch(`/api/invoices/${id}?action=issue`, {
    method: "PATCH",
  });
  const payload = (await response.json()) as InvoiceApi & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to issue invoice");
  }
  return payload;
};

export const getInvoiceStats = async (year?: number): Promise<InvoiceStats> => {
  const query = year ? `?year=${year}` : "";
  const response = await fetch(`/api/invoices/stats${query}`, { cache: "no-store" });
  const payload = (await response.json()) as InvoiceStats & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to load invoice statistics");
  }
  return payload;
};

