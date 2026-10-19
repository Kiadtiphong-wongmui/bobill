"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthAlertError } from "@/components/auth/auth-shell";
import {
  IconDocumentArrow,
  IconEye,
  IconMagnifyingGlass,
  IconPencil,
  IconPlus,
} from "@/components/invoices/invoice-list-icons";
import AppPageShell, {
  appBtnPrimaryClass,
  appControlClass,
} from "@/components/layout/app-page-shell";
import { QuotationActionsMenu } from "@/components/quotations/quotation-actions-menu";
import {
  QUOTATION_STATUS_TABS,
  quotationStatusBadgeClass,
  quotationStatusLabel,
} from "@/components/quotations/quotation-list-status";
import { Pagination } from "@/components/ui/pagination";
import { formatMoney } from "@/lib/format/money";
import {
  acceptQuotation,
  convertQuotationToInvoice,
  deleteQuotation,
  listQuotations,
  rejectQuotation,
  sendQuotation,
} from "@/lib/quotations/api";
import type { QuotationApi, QuotationStatus } from "@/lib/quotations/types";

type SortKey = "number" | "date" | "amount" | "seller" | "buyer" | "validUntil";

const COLUMNS: Array<{ key: SortKey; label: string; align?: "right" }> = [
  { key: "number", label: "เลขที่ใบเสนอราคา" },
  { key: "date", label: "วันที่" },
  { key: "validUntil", label: "ใช้ได้ถึง" },
  { key: "buyer", label: "ลูกค้า" },
  { key: "amount", label: "ยอดรวมสุทธิ", align: "right" },
];

const iconLinkClass = (tone: "amber" | "indigo" | "emerald") =>
  ({
    amber:
      "border-amber-250 bg-amber-50/55 text-amber-600 hover:border-amber-350 hover:bg-amber-100/50 hover:text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400",
    indigo:
      "border-indigo-250 bg-indigo-50/55 text-indigo-600 hover:border-indigo-350 hover:bg-indigo-100/50 hover:text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/20 dark:text-indigo-400",
    emerald:
      "border-emerald-250 bg-emerald-50/55 text-emerald-600 hover:border-emerald-350 hover:bg-emerald-100/50 hover:text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400",
  })[tone] + " inline-flex h-8 w-8 items-center justify-center rounded-lg border shadow-xs transition";

export default function QuotationListPage() {
  const router = useRouter();
  const [items, setItems] = useState<QuotationApi[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [searchText, setSearchText] = useState("");
  const [status, setStatus] = useState<QuotationStatus | "ALL">("ALL");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const runFetch = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await listQuotations({ page, pageSize, q, status, from, to, sortBy, sortDir });
        if (!cancelled) {
          setItems(response.items);
          setTotalPages(response.meta.totalPages);
          setTotal(response.meta.total);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดรายการใบเสนอราคาได้");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void runFetch();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, q, status, from, to, sortBy, sortDir, refreshKey]);

  const runAction = async (action: () => Promise<unknown>, confirmText: string, fallbackError: string) => {
    if (!window.confirm(confirmText)) return;
    try {
      await action();
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : fallbackError);
    }
  };

  const handleConvert = async (id: number) => {
    if (!window.confirm("แปลงใบเสนอราคานี้เป็นใบแจ้งหนี้ (ฉบับร่าง)?")) return;
    try {
      const result = await convertQuotationToInvoice(id);
      router.push(`/invoices/${result.invoice.id}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถแปลงเป็นใบแจ้งหนี้ได้");
    }
  };

  const applySearch = () => {
    setPage(1);
    setQ(searchText);
  };

  const handleHeaderClick = (column: SortKey) => {
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">รายการใบเสนอราคา</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            ติดตามสถานะใบเสนอราคา และแปลงเป็นใบแจ้งหนี้เมื่อลูกค้าตอบรับ การดำเนินการอยู่ในเมนูที่ปลายแถว
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/quotations/new" className={appBtnPrimaryClass}>
            <IconPlus className="h-5 w-5" />
            สร้างใบเสนอราคาใหม่
          </Link>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-200/90 bg-white/95 p-4 shadow-sm backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/90">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-lg flex-1 items-center gap-2">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-3 flex items-center text-zinc-400 dark:text-zinc-500">
                <IconMagnifyingGlass className="h-4 w-4" />
              </span>
              <input
                id="quotation-q"
                type="text"
                placeholder="ค้นหา เลขที่ใบเสนอราคา / ผู้ขาย / ลูกค้า..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-3 text-sm text-zinc-900 shadow-xs transition placeholder:text-zinc-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:bg-zinc-900"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch();
                }}
              />
            </div>
            <button type="button" onClick={applySearch} className={`${appBtnPrimaryClass} h-9 shrink-0 px-4 text-xs font-semibold`}>
              ค้นหา
            </button>
          </div>

          <div className="flex rounded-lg bg-zinc-150 p-0.5 dark:bg-zinc-800">
            {QUOTATION_STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setPage(1);
                  setStatus(tab.value);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  status === tab.value
                    ? "bg-white text-indigo-600 shadow-xs dark:bg-zinc-700 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2 dark:border-zinc-800">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="quotation-from">
              ตั้งแต่วันที่
            </label>
            <input
              id="quotation-from"
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
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400" htmlFor="quotation-to">
              ถึงวันที่
            </label>
            <input
              id="quotation-to"
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
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 shadow-lg shadow-indigo-950/5 backdrop-blur-sm dark:border-zinc-700/90 dark:bg-zinc-900/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-400">
                {COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    onClick={() => handleHeaderClick(column.key)}
                    className={`cursor-pointer select-none whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100/85 dark:hover:bg-zinc-800/60 ${
                      column.align === "right" ? "text-right" : ""
                    }`}
                  >
                    <div className={`flex items-center gap-1 ${column.align === "right" ? "justify-end" : ""}`}>
                      <span>{column.label}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {sortBy === column.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider">สถานะ</th>
                <th className="whitespace-nowrap px-4 py-3.5 pr-5 text-right text-xs font-semibold uppercase tracking-wider">
                  ดำเนินการ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    กำลังโหลดรายการ...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-400">
                    ไม่พบข้อมูลใบเสนอราคาตามเงื่อนไข
                  </td>
                </tr>
              ) : (
                items.map((quotation) => (
                  <tr key={quotation.id} className="transition hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100">
                      {quotation.quotationNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {new Date(quotation.documentDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                      {new Date(quotation.validUntil).toLocaleDateString("en-GB")}
                    </td>
                    <td
                      className="max-w-45 truncate px-4 py-3 text-zinc-700 dark:text-zinc-300"
                      title={quotation.buyerCompanyName ?? undefined}
                    >
                      {quotation.buyerCompanyName ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {formatMoney(quotation.grandTotal)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={quotationStatusBadgeClass(quotation.status)}>{quotationStatusLabel(quotation.status)}</span>
                    </td>
                    <td className="px-4 py-2 pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        {quotation.status === "DRAFT" && (
                          <Link href={`/quotations/${quotation.id}`} title="แก้ไขใบเสนอราคา" className={iconLinkClass("amber")}>
                            <IconPencil className="h-4 w-4" />
                          </Link>
                        )}
                        <Link href={`/quotations/${quotation.id}/view`} title="ดูรายละเอียด" className={iconLinkClass("indigo")}>
                          <IconEye className="h-4 w-4" />
                        </Link>
                        <a
                          href={`/api/quotations/${quotation.id}/export-pdf`}
                          target="_blank"
                          rel="noreferrer"
                          title="ส่งออก PDF"
                          className={iconLinkClass("emerald")}
                        >
                          <IconDocumentArrow className="h-4 w-4" />
                        </a>

                        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700" />

                        <QuotationActionsMenu
                          quotation={quotation}
                          onSend={(id) => runAction(() => sendQuotation(id), "ยืนยันส่งใบเสนอราคานี้?", "ไม่สามารถส่งใบเสนอราคาได้")}
                          onAccept={(id) =>
                            runAction(() => acceptQuotation(id), "ยืนยันว่าลูกค้าตอบรับใบเสนอราคานี้?", "ไม่สามารถบันทึกการตอบรับได้")
                          }
                          onReject={(id) =>
                            runAction(() => rejectQuotation(id), "ยืนยันว่าลูกค้าปฏิเสธใบเสนอราคานี้?", "ไม่สามารถบันทึกการปฏิเสธได้")
                          }
                          onConvert={handleConvert}
                          onDelete={(id) =>
                            runAction(() => deleteQuotation(id), "ยืนยันลบใบเสนอราคาฉบับร่างนี้? การลบไม่สามารถย้อนกลับได้", "ไม่สามารถลบใบเสนอราคาได้")
                          }
                        />
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
