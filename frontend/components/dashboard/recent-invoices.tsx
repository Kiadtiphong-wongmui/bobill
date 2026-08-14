"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AuthAlertError } from "@/components/auth/auth-shell";
import { appCardClass } from "@/components/layout/app-page-shell";
import { formatMoney } from "@/lib/format/money";
import { listRecentInvoices } from "@/lib/invoices/api";
import type { InvoiceApi } from "@/lib/invoices/types";

function IconClock({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function statusLabel(status: string) {
  if (status === "ISSUED") return "ออกเอกสารแล้ว";
  if (status === "CANCELLED") return "ยกเลิก";
  return "ฉบับร่าง";
}

function statusClass(status: string) {
  if (status === "ISSUED") return "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-300";
  if (status === "CANCELLED") return "bg-red-100 text-red-800 ring-1 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300";
  return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300/40 dark:bg-zinc-800 dark:text-zinc-300";
}

export default function RecentInvoices() {
  const [items, setItems] = useState<InvoiceApi[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const result = await listRecentInvoices(5);
        setItems(result);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to load recent invoices");
      }
    };
    void run();
  }, []);

  return (
    <section className={appCardClass}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300">
            <IconClock />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">ใบเสร็จล่าสุด</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">อัปเดตจากระบบโดยตรง</p>
          </div>
        </div>
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-800 transition hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/40"
        >
          ดูทั้งหมด
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
      {errorMessage ? (
        <div className="mb-3">
          <AuthAlertError message={errorMessage} />
        </div>
      ) : null}
      {!errorMessage && items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-400">
          ยังไม่มีรายการใบเสร็จ — เริ่มจากการสร้างใบเสร็จใหม่
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((invoice) => (
            <li key={invoice.id}>
              <Link
                href={`/invoices/${invoice.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 transition hover:border-indigo-200 hover:bg-white hover:shadow-sm dark:border-zinc-700/80 dark:bg-zinc-800/40 dark:hover:border-indigo-500/30 dark:hover:bg-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{invoice.invoiceNumber}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {invoice.buyerCompanyName ?? "—"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{formatMoney(invoice.grandTotal)}</p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusClass(invoice.status)}`}
                  >
                    {statusLabel(invoice.status)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
