"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { AuthAlertError } from "@/components/auth/auth-shell";
import { formatMoney } from "@/lib/format/money";
import AppPageShell, {
  appBtnSecondaryClass,
  appCardClass,
} from "@/components/layout/app-page-shell";
import { getInvoice } from "@/lib/invoices/api";
import type { InvoiceApi } from "@/lib/invoices/types";

function IconEye({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function IconList({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function IconPencil({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
  );
}

function IconDocumentArrow({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m-3 0H5.625c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h17.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H20.25M9.75 18h.375m-.375 0H8.625c-.621 0-1.125-.504-1.125-1.125v-1.5c0-.621.504-1.125 1.125-1.125h7.875c.621 0 1.125.504 1.125 1.125V18a1.125 1.125 0 01-1.125 1.125H9.75z" />
    </svg>
  );
}

function statusBadge(status: InvoiceApi["status"]) {
  const base = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1";
  if (status === "ISSUED") return `${base} bg-emerald-100 text-emerald-800 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-300`;
  if (status === "CANCELLED") return `${base} bg-red-100 text-red-800 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300`;
  return `${base} bg-zinc-100 text-zinc-700 ring-zinc-400/20 dark:bg-zinc-800 dark:text-zinc-300`;
}

function statusText(status: InvoiceApi["status"]) {
  if (status === "DRAFT") return "ฉบับร่าง";
  if (status === "ISSUED") return "ออกเอกสารแล้ว";
  return "ยกเลิก";
}

export default function InvoiceReadOnlyPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const idValid = Number.isFinite(id) && Number.isInteger(id) && id > 0;

  const [invoice, setInvoice] = useState<InvoiceApi | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [prevId, setPrevId] = useState<number | null>(null);
  if (id !== prevId) {
    setPrevId(id);
    if (!idValid) {
      setInvoice(null);
      setLoadError("รหัสใบเสร็จไม่ถูกต้อง");
      setIsLoading(false);
    } else {
      setLoadError(null);
      setInvoice(null);
      setIsLoading(true);
    }
  }

  useEffect(() => {
    if (!idValid) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        const result = await getInvoice(id);
        if (!cancelled) setInvoice(result);
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "ไม่สามารถโหลดใบเสร็จได้");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, idValid]);

  const errorMessage = !idValid ? "รหัสใบเสร็จไม่ถูกต้อง" : loadError;

  const subtotal = useMemo(() => (invoice ? formatMoney(invoice.subtotal) : "0.00"), [invoice]);
  const discount = useMemo(() => (invoice ? formatMoney(invoice.discountTotal) : "0.00"), [invoice]);
  const grand = useMemo(() => (invoice ? formatMoney(invoice.grandTotal) : "0.00"), [invoice]);

  return (
    <AppPageShell reading>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <IconEye />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              ดูอย่างเดียว
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              รายละเอียดใบเสร็จ
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {invoice ? `เลขที่ ${invoice.invoiceNumber}` : "โหลดข้อมูลจากระบบ"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className={appBtnSecondaryClass} href="/invoices">
            <IconList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            กลับไปรายการ
          </Link>
          {invoice ? (
            <>
              {invoice.status === "DRAFT" && (
                <Link
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-250 bg-amber-50/55 px-4 py-2.5 text-sm font-semibold text-amber-600 shadow-xs transition hover:border-amber-350 hover:bg-amber-100/50 hover:text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400 dark:hover:border-amber-800 dark:hover:text-amber-300"
                  href={`/invoices/${invoice.id}`}
                >
                  <IconPencil className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  แก้ไข
                </Link>
              )}
              <a
                href={`/api/invoices/${invoice.id}/export-pdf`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-250 bg-emerald-50/55 px-4 py-2.5 text-sm font-semibold text-emerald-600 shadow-xs transition hover:border-emerald-350 hover:bg-emerald-100/50 hover:text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:border-emerald-800 dark:hover:text-emerald-300"
              >
                <IconDocumentArrow className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                ส่งออก PDF
              </a>
            </>
          ) : null}
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4">
          <AuthAlertError message={errorMessage} />
        </div>
      ) : null}

      {idValid && isLoading && !errorMessage ? (
        <div className={`${appCardClass} mt-6 flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center`}>
          <svg
            className="h-8 w-8 animate-spin text-indigo-600"
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
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">กำลังโหลดข้อมูลใบเสร็จ…</p>
        </div>
      ) : null}

      {invoice ? (
        <div className="mt-6 space-y-6">
          <section className={appCardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <p className="text-lg font-bold text-zinc-900 underline decoration-indigo-200 decoration-2 underline-offset-4 dark:text-zinc-50 dark:decoration-indigo-500/40">
                  ใบเสร็จรับเงิน
                </p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">เลขที่</dt>
                    <dd className="mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100">{invoice.invoiceNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">วันที่เอกสาร</dt>
                    <dd className="mt-0.5 font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {new Date(invoice.documentDate).toLocaleDateString("en-GB")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">สถานะ</dt>
                    <dd className="mt-1">
                      <span className={statusBadge(invoice.status)}>{statusText(invoice.status)}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">เครดิต</dt>
                    <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{invoice.creditDays ?? 0} วัน</dd>
                  </div>
                </dl>
              </div>
              <div className="min-w-0 max-w-md rounded-xl bg-zinc-50/80 px-4 py-3 text-sm dark:bg-zinc-800/50">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">เงื่อนไขชำระเงิน</p>
                <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">{invoice.paymentTerms ?? "—"}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">ผู้ขาย</p>
                <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">{invoice.sellerCompanyName}</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {invoice.sellerAddress}
                </p>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  เลขผู้เสียภาษี: <span className="font-medium text-zinc-800 dark:text-zinc-200">{invoice.sellerTaxId ?? "—"}</span>
                </p>
              </div>
              {invoice.includeBuyer !== false ? (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-800/30">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">ผู้ซื้อ</p>
                  <p className="mt-2 font-semibold text-zinc-900 dark:text-zinc-50">{invoice.buyerCompanyName ?? "—"}</p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {invoice.buyerAddress ?? "—"}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    เลขผู้เสียภาษี:{" "}
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{invoice.buyerTaxId ?? "—"}</span>
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  <p className="font-semibold text-zinc-600 dark:text-zinc-300">ผู้ซื้อ</p>
                  <p className="mt-1">ไม่ใช้งานบนใบเสร็จ</p>
                </div>
              )}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-zinc-200/90 bg-white/90 shadow-lg shadow-indigo-950/5 backdrop-blur-sm dark:border-zinc-700/90 dark:bg-zinc-900/80">
            <div className="overflow-x-auto">
              <table className="w-full min-w-130 border-collapse text-sm">
                <thead>
                  <tr className="bg-linear-to-r from-indigo-600 to-indigo-500 text-left text-white dark:from-indigo-900 dark:to-indigo-800">
                    <th className="px-3 py-3 font-semibold">#</th>
                    <th className="px-3 py-3 font-semibold">รายการ</th>
                    <th className="px-3 py-3 text-right font-semibold">จำนวน</th>
                    <th className="px-3 py-3 text-right font-semibold">ราคา/หน่วย</th>
                    <th className="px-3 py-3 text-right font-semibold">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {invoice.items.map((item) => (
                    <tr key={item.lineNo} className="transition hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20">
                      <td className="px-3 py-2.5 tabular-nums text-zinc-600 dark:text-zinc-400">{item.lineNo}</td>
                      <td className="px-3 py-2.5 font-medium text-zinc-900 dark:text-zinc-100">{item.description}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{formatMoney(item.quantity)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{formatMoney(item.unitPrice)}</td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                        {formatMoney(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={`${appCardClass} ml-auto w-full max-w-sm`}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>รวมเงิน</span>
                <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">{subtotal}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>ส่วนลด</span>
                <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">{discount}</span>
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-3 text-base font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-50">
                <span>รวมชำระทั้งสิ้น</span>
                <span className="tabular-nums text-indigo-700 dark:text-indigo-300">{grand}</span>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </AppPageShell>
  );
}
