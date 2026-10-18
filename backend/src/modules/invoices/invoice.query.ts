import type { Request } from "express";

import { INVOICE_STATUSES } from "./invoice.types.js";
import type { InvoiceStatus } from "./invoice.types.js";

export type InvoiceListQuery = {
  page: number;
  pageSize: number;
  q?: string;
  seller?: string;
  buyer?: string;
  status?: InvoiceStatus;
  from?: Date;
  to?: Date;
  sortBy: "number" | "date" | "amount" | "seller" | "buyer";
  sortDir: "asc" | "desc";
};

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const scalar = Array.isArray(value) ? value[0] : value;
  const parsed = Number(scalar);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const parseDateSafe = (value: unknown): Date | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const scalar = Array.isArray(value) ? value[0] : value;
  const parsed = new Date(String(scalar));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

/**
 * Normalizes Express `req.query` for {@link invoiceService.list}.
 */
export const parseInvoiceListQuery = (query: Request["query"]): InvoiceListQuery => {
  const qVal = query.q;
  const qRaw = String(Array.isArray(qVal) ? qVal[0] ?? "" : qVal ?? "").trim();
  const q = qRaw.length > 0 ? qRaw : undefined;

  const sellerVal = query.seller;
  const sellerRaw = String(Array.isArray(sellerVal) ? sellerVal[0] ?? "" : sellerVal ?? "").trim();
  const seller = sellerRaw.length > 0 ? sellerRaw : undefined;

  const buyerVal = query.buyer;
  const buyerRaw = String(Array.isArray(buyerVal) ? buyerVal[0] ?? "" : buyerVal ?? "").trim();
  const buyer = buyerRaw.length > 0 ? buyerRaw : undefined;

  const statusVal = query.status;
  const statusRaw = String(Array.isArray(statusVal) ? statusVal[0] ?? "" : statusVal ?? "").toUpperCase();
  const status = INVOICE_STATUSES.includes(statusRaw as InvoiceStatus) ? (statusRaw as InvoiceStatus) : undefined;

  const page = parsePositiveInt(query.page, 1);
  const pageSize = Math.min(parsePositiveInt(query.pageSize, 10), 50);
  const from = parseDateSafe(query.from);
  const to = parseDateSafe(query.to);

  const sortByVal = query.sortBy;
  const sortDirVal = query.sortDir;
  const sortByRaw = String(Array.isArray(sortByVal) ? sortByVal[0] ?? "date" : sortByVal ?? "date").toLowerCase();
  const sortDirRaw = String(Array.isArray(sortDirVal) ? sortDirVal[0] ?? "desc" : sortDirVal ?? "desc").toLowerCase();

  let sortBy: "number" | "date" | "amount" | "seller" | "buyer" = "date";
  if (sortByRaw === "number") {
    sortBy = "number";
  } else if (sortByRaw === "amount") {
    sortBy = "amount";
  } else if (sortByRaw === "seller") {
    sortBy = "seller";
  } else if (sortByRaw === "buyer") {
    sortBy = "buyer";
  }

  const sortDir = sortDirRaw === "asc" ? "asc" : "desc";

  const result: InvoiceListQuery = {
    page,
    pageSize,
    sortBy,
    sortDir,
  };
  if (q !== undefined) result.q = q;
  if (seller !== undefined) result.seller = seller;
  if (buyer !== undefined) result.buyer = buyer;
  if (status !== undefined) result.status = status;
  if (from !== undefined) result.from = from;
  if (to !== undefined) result.to = to;
  return result;
};

export const parseInvoiceRecentLimit = (query: Request["query"]): number => {
  return Math.min(parsePositiveInt(query.limit, 5), 20);
};
