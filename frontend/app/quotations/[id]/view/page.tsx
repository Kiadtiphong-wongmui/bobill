"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthAlertError } from "@/components/auth/auth-shell";
import AppPageShell, {
  appBtnPrimaryClass,
  appBtnSecondaryClass,
  appCardClass,
} from "@/components/layout/app-page-shell";
import { quotationStatusBadgeClass, quotationStatusLabel } from "@/components/quotations/quotation-list-status";
import { formatMoney } from "@/lib/format/money";
import {
  acceptQuotation,
  convertQuotationToInvoice,
  getQuotation,
  rejectQuotation,
  sendQuotation,
} from "@/lib/quotations/api";
import type { QuotationApi } from "@/lib/quotations/types";

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-GB");

export default function QuotationReadOnlyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const idValid = Number.isInteger(id) && id > 0;

  const [quotation, setQuotation] = useState<QuotationApi | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(idValid);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!idValid) return;
    let cancelled = false;

    const fetchData = async () => {
      try {
        const result = await getQuotation(id);
        if (!cancelled) setQuotation(result);
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "ไม่สามารถโหลดใบเสนอราคาได้");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void fetchData();
    return () => {
      cancelled = true;
    };
  }, [id, idValid]);

  const runTransition = async (action: () => Promise<QuotationApi>, confirmText: string) => {
    if (!window.confirm(confirmText)) return;
    setIsBusy(true);
    setActionError(null);
    try {
      setQuotation(await action());
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "ไม่สามารถดำเนินการได้");
    } finally {
      setIsBusy(false);
    }
  };

  const handleConvert = async () => {
    if (!window.confirm("แปลงใบเสนอราคานี้เป็นใบแจ้งหนี้ (ฉบับร่าง)?")) return;
    setIsBusy(true);
    setActionError(null);
    try {
      const result = await convertQuotationToInvoice(id);
      router.push(`/invoices/${result.invoice.id}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "ไม่สามารถแปลงเป็นใบแจ้งหนี้ได้");
      setIsBusy(false);
    }
  };

  const error = !idValid ? "รหัสใบเสนอราคาไม่ถูกต้อง" : loadError;

  return (
    <AppPageShell reading>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            ใบเสนอราคา {quotation?.quotationNumber ?? ""}
          </h1>
          {quotation ? (
            <span className={`${quotationStatusBadgeClass(quotation.status)} mt-2`}>{quotationStatusLabel(quotation.status)}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/quotations" className={appBtnSecondaryClass}>
            กลับรายการ
          </Link>
          {quotation?.status === "DRAFT" ? (
            <Link href={`/quotations/${quotation.id}`} className={appBtnSecondaryClass}>
              แก้ไข
            </Link>
          ) : null}
          {quotation ? (
            <a href={`/api/quotations/${quotation.id}/export-pdf`} target="_blank" rel="noreferrer" className={appBtnSecondaryClass}>
              ส่งออก PDF
            </a>
          ) : null}
        </div>
      </div>

      {isLoading ? <p className="mt-8 text-center text-zinc-500">กำลังโหลด...</p> : null}
      {error ? (
        <div className="mt-6">
          <AuthAlertError message={error} />
        </div>
      ) : null}

      {quotation ? (
        <>
          <section className={`${appCardClass} mt-6`}>
            <div className="grid gap-6 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">ผู้เสนอราคา</p>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{quotation.sellerCompanyName}</p>
                <p className="text-zinc-600 dark:text-zinc-400">{quotation.sellerAddress}</p>
                {quotation.sellerTaxId ? <p className="text-zinc-600 dark:text-zinc-400">เลขภาษี: {quotation.sellerTaxId}</p> : null}
                {quotation.sellerPhone ? <p className="text-zinc-600 dark:text-zinc-400">โทร: {quotation.sellerPhone}</p> : null}
              </div>
              <div className="space-y-1 sm:text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">ข้อมูลเอกสาร</p>
                <p className="text-zinc-700 dark:text-zinc-300">วันที่: {formatDate(quotation.documentDate)}</p>
                <p className="text-zinc-700 dark:text-zinc-300">ใช้ได้ถึง: {formatDate(quotation.validUntil)}</p>
                {quotation.paymentTerms ? (
                  <p className="text-zinc-700 dark:text-zinc-300">ชำระ: {quotation.paymentTerms}</p>
                ) : null}
              </div>
              {quotation.includeBuyer !== false ? (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">ลูกค้า</p>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{quotation.buyerCompanyName ?? "—"}</p>
                  <p className="text-zinc-600 dark:text-zinc-400">{quotation.buyerAddress ?? ""}</p>
                  {quotation.buyerTaxId ? <p className="text-zinc-600 dark:text-zinc-400">เลขภาษี: {quotation.buyerTaxId}</p> : null}
                </div>
              ) : null}
            </div>
          </section>

          <section className={`${appCardClass} mt-4 overflow-x-auto`}>
            <table className="w-full min-w-120 border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wider text-zinc-500 dark:border-zinc-700">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">รายการ</th>
                  <th className="px-2 py-2 text-right">จำนวน</th>
                  <th className="px-2 py-2 text-right">ราคา/หน่วย</th>
                  <th className="px-2 py-2 text-right">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {quotation.items.map((item) => (
                  <tr key={item.lineNo}>
                    <td className="px-2 py-2 text-zinc-500">{item.lineNo}</td>
                    <td className="px-2 py-2 text-zinc-900 dark:text-zinc-100">{item.description}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatMoney(item.quantity)}</td>
                    <td className="px-2 py-2 text-right tabular-nums">{formatMoney(item.unitPrice)}</td>
                    <td className="px-2 py-2 text-right font-medium tabular-nums">{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>รวมเงิน</span>
                <span className="tabular-nums">{formatMoney(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>ส่วนลด</span>
                <span className="tabular-nums">{formatMoney(quotation.discountTotal)}</span>
              </div>
              {quotation.vatEnabled ? (
                <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                  <span>ภาษีมูลค่าเพิ่ม {Number(quotation.vatRate)}%</span>
                  <span className="tabular-nums">{formatMoney(quotation.vatAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-zinc-300 pt-2 text-base font-bold text-indigo-700 dark:text-indigo-400">
                <span>รวมทั้งสิ้น</span>
                <span className="tabular-nums">{formatMoney(quotation.grandTotal)}</span>
              </div>
            </div>

            {quotation.note ? <p className="mt-2 whitespace-pre-wrap text-sm text-red-600">* {quotation.note}</p> : null}
          </section>

          {actionError ? (
            <div className="mt-4">
              <AuthAlertError message={actionError} />
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {quotation.status === "DRAFT" ? (
              <button
                type="button"
                disabled={isBusy}
                className={appBtnPrimaryClass}
                onClick={() => runTransition(() => sendQuotation(id), "ยืนยันส่งใบเสนอราคานี้?")}
              >
                ส่งใบเสนอราคา
              </button>
            ) : null}
            {quotation.status === "SENT" ? (
              <>
                <button
                  type="button"
                  disabled={isBusy}
                  className={appBtnPrimaryClass}
                  onClick={() => runTransition(() => acceptQuotation(id), "ยืนยันว่าลูกค้าตอบรับใบเสนอราคานี้?")}
                >
                  ลูกค้าตอบรับ
                </button>
                <button
                  type="button"
                  disabled={isBusy}
                  className={appBtnSecondaryClass}
                  onClick={() => runTransition(() => rejectQuotation(id), "ยืนยันว่าลูกค้าปฏิเสธใบเสนอราคานี้?")}
                >
                  ลูกค้าปฏิเสธ
                </button>
              </>
            ) : null}
            {quotation.status === "ACCEPTED" && quotation.convertedInvoiceId === null ? (
              <button type="button" disabled={isBusy} className={appBtnPrimaryClass} onClick={handleConvert}>
                แปลงเป็นใบแจ้งหนี้
              </button>
            ) : null}
            {quotation.convertedInvoiceId !== null ? (
              <Link href={`/invoices/${quotation.convertedInvoiceId}`} className={appBtnSecondaryClass}>
                ดูใบแจ้งหนี้ที่สร้างแล้ว
              </Link>
            ) : null}
          </div>
        </>
      ) : null}
    </AppPageShell>
  );
}
