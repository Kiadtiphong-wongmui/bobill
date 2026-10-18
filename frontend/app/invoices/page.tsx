"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { InvoiceActionsMenu } from "@/components/invoices/invoice-actions-menu";
import {
  IconDocumentArrow,
  IconEye,
  IconFunnel,
  IconMagnifyingGlass,
  IconPencil,
  IconPlus,
} from "@/components/invoices/invoice-list-icons";
import { Pagination } from "@/components/ui/pagination";
import { invoiceStatusBadgeClass, invoiceStatusLabel } from "@/components/invoices/invoice-list-status";
import { AuthAlertError } from "@/components/auth/auth-shell";
import AppPageShell, {
  appBtnPrimaryClass,
  appBtnSecondaryClass,
  appControlClass,
} from "@/components/layout/app-page-shell";
import { formatMoney } from "@/lib/format/money";
import { cancelInvoice, issueInvoice, listInvoices } from "@/lib/invoices/api";
import type { InvoiceApi } from "@/lib/invoices/types";

type StatusFilter = "ALL" | "DRAFT" | "ISSUED" | "CANCELLED";

export default function InvoiceListPage() {
  const [items, setItems] = useState<InvoiceApi[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [searchText, setSearchText] = useState("");
  const [seller, setSeller] = useState("");
  const [searchSeller, setSearchSeller] = useState("");
  const [buyer, setBuyer] = useState("");
  const [searchBuyer, setSearchBuyer] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<"number" | "date" | "amount" | "seller" | "buyer">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [prevParams, setPrevParams] = useState({ page, pageSize, q, seller, buyer, status, from, to, sortBy, sortDir, refreshKey });
  if (
    page !== prevParams.page ||
    pageSize !== prevParams.pageSize ||
    q !== prevParams.q ||
    seller !== prevParams.seller ||
    buyer !== prevParams.buyer ||
    status !== prevParams.status ||
    from !== prevParams.from ||
    to !== prevParams.to ||
    sortBy !== prevParams.sortBy ||
    sortDir !== prevParams.sortDir ||
    refreshKey !== prevParams.refreshKey
  ) {
    setPrevParams({ page, pageSize, q, seller, buyer, status, from, to, sortBy, sortDir, refreshKey });
    setIsLoading(true);
    setErrorMessage(null);
  }

  useEffect(() => {
    let cancelled = false;

    const runFetch = async () => {
      try {
        const response = await listInvoices({ page, pageSize, q, seller, buyer, status, from, to, sortBy, sortDir });
        if (!cancelled) {
          setItems(response.items);
          setTotalPages(response.meta.totalPages);
          setTotal(response.meta.total);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดรายการใบแจ้งหนี้ได้");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void runFetch();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, q, seller, buyer, status, from, to, sortBy, sortDir, refreshKey]);



  const handleCancel = async (invoiceId: number) => {
    if (!window.confirm("ยืนยันยกเลิกใบเสร็จนี้?")) return;
    try {
      await cancelInvoice(invoiceId);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถยกเลิกใบเสร็จได้");
    }
  };

  const handleIssue = async (invoiceId: number) => {
    if (!window.confirm("ยืนยันออกใบเสร็จฉบับนี้?")) return;
    try {
      await issueInvoice(invoiceId);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถออกใบเสร็จได้");
    }
  };

  const applySearch = () => {
    setPage(1);
    setQ(searchText);
    setSeller(searchSeller);
    setBuyer(searchBuyer);
  };

  const handleHeaderClick = (column: "number" | "date" | "amount" | "seller" | "buyer") => {
    setPage(1);
    if (sortBy === column) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDir("desc");
    }
  };



  return (
    <AppPageShell>
      <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">รายการใบแจ้งหนี้</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            ค้นหาและกรองจากด้านล่าง การดำเนินการแต่ละใบอยู่ในเมนู <span className="font-medium text-zinc-800 dark:text-zinc-200">จัดการ</span>{" "}
            ที่ปลายแถว
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/invoices/new" className={appBtnPrimaryClass}>
            <IconPlus className="h-5 w-5" />
            สร้างใบเสร็จใหม่
          </Link>
        </div>
      </header>

      {/* TOOLBAR SEARCH & FILTERS */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Left: Search input & button */}
          <div className="flex flex-1 items-center gap-2 max-w-lg">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-500">
                <IconMagnifyingGlass className="h-4 w-4" />
              </span>
              <input
                id="invoice-q"
                type="text"
                placeholder="ค้นหา เลขที่ใบเสร็จ / ผู้ขาย / ผู้ซื้อ..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-3 text-sm text-zinc-900 shadow-xs transition placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:bg-zinc-900"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch();
                }}
              />
            </div>
            <button
              type="button"
              onClick={applySearch}
              className={`${appBtnPrimaryClass} h-9 px-4 text-xs font-semibold shrink-0`}
            >
              ค้นหา
            </button>
          </div>

          {/* Right: Quick Status Tabs/Pills & Toggle Advanced */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg bg-zinc-150 p-0.5 dark:bg-zinc-800">
              {(["ALL", "DRAFT", "ISSUED", "CANCELLED"] as StatusFilter[]).map((st) => {
                const isActive = status === st;
                const labels: Record<StatusFilter, string> = {
                  ALL: "ทั้งหมด",
                  DRAFT: "ฉบับร่าง",
                  ISSUED: "ออกแล้ว",
                  CANCELLED: "ยกเลิก",
                };
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setPage(1);
                      setStatus(st);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-white text-indigo-600 shadow-xs dark:bg-zinc-700 dark:text-zinc-100"
                        : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    {labels[st]}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className={`${appBtnSecondaryClass} h-9 gap-1.5 px-3 py-1.5 text-xs`}
            >
              <IconFunnel className={`h-4 w-4 transition-colors ${showAdvanced ? "text-indigo-650 dark:text-indigo-400" : "text-zinc-500"}`} />
              <span>ตัวกรองเพิ่มเติม</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2 md:grid-cols-4 dark:border-zinc-800">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="invoice-seller">
                ผู้ขาย
              </label>
              <input
                id="invoice-seller"
                type="text"
                placeholder="ชื่อผู้ขาย..."
                className={appControlClass}
                value={searchSeller}
                onChange={(event) => setSearchSeller(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="invoice-buyer">
                ผู้ซื้อ
              </label>
              <input
                id="invoice-buyer"
                type="text"
                placeholder="ชื่อผู้ซื้อ..."
                className={appControlClass}
                value={searchBuyer}
                onChange={(event) => setSearchBuyer(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch();
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="invoice-from">
                ตั้งแต่วันที่
              </label>
              <input
                id="invoice-from"
                type="date"
                className={appControlClass}
                value={from}
                onChange={(event) => {
                  setPage(1);
                  setFrom(event.target.value);
                }}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="invoice-to">
                ถึงวันที่
              </label>
              <input
                id="invoice-to"
                type="date"
                className={appControlClass}
                value={to}
                onChange={(event) => {
                  setPage(1);
                  setTo(event.target.value);
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 shadow-lg shadow-indigo-950/5 backdrop-blur-sm dark:border-zinc-700/90 dark:bg-zinc-900/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                <th
                  onClick={() => handleHeaderClick("number")}
                  className="whitespace-nowrap px-4 py-3.5 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-zinc-100/85 dark:hover:bg-zinc-800/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>เลขที่ใบเสร็จ</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {sortBy === "number" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderClick("date")}
                  className="whitespace-nowrap px-4 py-3.5 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-zinc-100/85 dark:hover:bg-zinc-800/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>วันที่</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {sortBy === "date" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderClick("seller")}
                  className="whitespace-nowrap px-4 py-3.5 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-zinc-100/85 dark:hover:bg-zinc-800/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>ผู้ขาย</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {sortBy === "seller" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderClick("buyer")}
                  className="whitespace-nowrap px-4 py-3.5 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-zinc-100/85 dark:hover:bg-zinc-800/60 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>ผู้ซื้อ</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {sortBy === "buyer" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </div>
                </th>
                <th
                  onClick={() => handleHeaderClick("amount")}
                  className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-zinc-100/85 dark:hover:bg-zinc-800/60 select-none"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>ยอดรวมสุทธิ</span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                      {sortBy === "amount" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                    </span>
                  </div>
                </th>
                <th className="whitespace-nowrap px-4 py-3.5 font-semibold text-xs uppercase tracking-wider">สถานะ</th>
                <th className="whitespace-nowrap px-4 py-3.5 pr-5 text-right font-semibold text-xs uppercase tracking-wider">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <span className="inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <svg
                        className="h-5 w-5 animate-spin text-indigo-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      กำลังโหลดรายการ...
                    </span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    ไม่พบข้อมูลใบเสร็จตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                items.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {new Date(invoice.documentDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="max-w-45 truncate px-4 py-3 text-zinc-700 dark:text-zinc-300" title={invoice.sellerCompanyName}>
                      {invoice.sellerCompanyName}
                    </td>
                    <td className="max-w-45 truncate px-4 py-3 text-zinc-700 dark:text-zinc-300" title={invoice.buyerCompanyName ?? undefined}>
                      {invoice.buyerCompanyName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatMoney(invoice.grandTotal)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={invoiceStatusBadgeClass(invoice)}>{invoiceStatusLabel(invoice.status)}</span>
                    </td>
                    <td className="px-4 py-2 pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        {invoice.status === "DRAFT" && (
                          <Link
                            href={`/invoices/${invoice.id}`}
                            title="แก้ไขใบเสร็จ"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-amber-250 bg-amber-50/55 text-amber-600 shadow-xs transition hover:border-amber-350 hover:bg-amber-100/50 hover:text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:border-amber-800 dark:hover:text-amber-300"
                          >
                            <IconPencil className="h-4 w-4" />
                          </Link>
                        )}
                        <Link
                          href={`/invoices/${invoice.id}/view`}
                          title="ดูรายละเอียด"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-250 bg-indigo-50/55 text-indigo-600 shadow-xs transition hover:border-indigo-350 hover:bg-indigo-100/50 hover:text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400 dark:hover:border-indigo-800 dark:hover:text-indigo-300"
                        >
                          <IconEye className="h-4 w-4" />
                        </Link>
                        <a
                          href={`/api/invoices/${invoice.id}/export-pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="ส่งออก PDF"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-250 bg-emerald-50/55 text-emerald-600 shadow-xs transition hover:border-emerald-350 hover:bg-emerald-100/50 hover:text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:border-emerald-800 dark:hover:text-emerald-300"
                        >
                          <IconDocumentArrow className="h-4 w-4" />
                        </a>
                        
                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

                        <InvoiceActionsMenu invoice={invoice} onIssue={handleIssue} onCancel={handleCancel} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4">
          <AuthAlertError message={errorMessage} />
        </div>
      ) : null}

      <Pagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        totalPages={totalPages}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </AppPageShell>
  );
}
