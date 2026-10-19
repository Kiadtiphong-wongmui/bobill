import type { Request } from "express";

import { QUOTATION_STATUSES } from "./quotation.types.js";
import type { QuotationStatus } from "./quotation.types.js";

export type QuotationListQuery = {
  page: number;
  pageSize: number;
  q?: string;
  seller?: string;
  buyer?: string;
  status?: QuotationStatus;
  from?: Date;
  to?: Date;
  sortBy: "number" | "date" | "amount" | "seller" | "buyer" | "validUntil";
  sortDir: "asc" | "desc";
};

const scalar = (value: unknown): string => String(Array.isArray(value) ? value[0] ?? "" : value ?? "");

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const parseDateSafe = (value: unknown): Date | undefined => {
  const text = scalar(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const SORT_KEYS = ["number", "date", "amount", "seller", "buyer", "validUntil"] as const;

/** Normalizes Express `req.query` for {@link quotationService.list}. */
export const parseQuotationListQuery = (query: Request["query"]): QuotationListQuery => {
  const q = scalar(query.q).trim() || undefined;
  const seller = scalar(query.seller).trim() || undefined;
  const buyer = scalar(query.buyer).trim() || undefined;
  const statusRaw = scalar(query.status).toUpperCase();
  const status = QUOTATION_STATUSES.includes(statusRaw as QuotationStatus)
    ? (statusRaw as QuotationStatus)
    : undefined;
  const from = parseDateSafe(query.from);
  const to = parseDateSafe(query.to);

  const sortByRaw = scalar(query.sortBy || "date");
  const sortBy = SORT_KEYS.find((key) => key.toLowerCase() === sortByRaw.toLowerCase()) ?? "date";
  const sortDir = scalar(query.sortDir || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const result: QuotationListQuery = {
    page: parsePositiveInt(query.page, 1),
    pageSize: Math.min(parsePositiveInt(query.pageSize, 10), 50),
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

export const parseQuotationRecentLimit = (query: Request["query"]): number =>
  Math.min(parsePositiveInt(query.limit, 5), 20);
