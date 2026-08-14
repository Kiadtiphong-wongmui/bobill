"use client";

import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { formatMoney } from "@/lib/format/money";
import { normalizeInvoicePrefixStem } from "@/lib/invoices/invoice-prefix";
import type { InvoiceForm } from "@/lib/invoices/types";
import {
  appBtnSecondaryClass,
  appBtnSuccessClass,
  appControlClass,
} from "@/components/layout/app-page-shell";

const PAYMENT_OPTIONS = ["โอนชำระผ่านบัญชี", "PromptPay", "เงินสด"] as const;

/** Match backend sanitize + hyphen rule for preview only. */
function toPreviewPrefix(stem: string): string {
  const safe = stem.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
  if (!safe) return "RC-";
  return safe.endsWith("-") ? safe : `${safe}-`;
}

const signatureBlocks = [
  { key: "approvedBy", label: "อนุมัติโดย" },
  { key: "receivedBy", label: "ผู้รับเงิน" },
  { key: "payer", label: "ผู้จ่ายเงิน" },
] as const;

/** Form section card: appCardClass pattern + left indigo accent */
const sectionCardClass =
  "rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-lg shadow-indigo-950/5 backdrop-blur-sm [border-left-width:3px] border-l-indigo-500";

const sectionTitleClass = "text-lg font-bold text-zinc-900 dark:text-zinc-50";

const inputClass = `${appControlClass} mt-1`;

const dangerIconBtnClass =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300";

const exportPdfClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-100 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2";

export type InvoiceEditorFormProps = {
  form: InvoiceForm;
  setForm: Dispatch<SetStateAction<InvoiceForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSubmitting: boolean;
  exportId?: number;
  errorMessage: string | null;
  successMessage: string | null;
  subtotal: number;
  grandTotal: number;
  setLine: (index: number, key: "description" | "quantity" | "unitPrice", value: string) => void;
  addLine: () => void;
  removeLine: (index: number) => void;
  setSignatureField: (
    key: "approvedBy" | "receivedBy" | "payer",
    field: "dottedText" | "bracketText" | "imageDataUrl",
    value: string,
  ) => void;
};

export function InvoiceEditorForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  isSubmitting,
  exportId,
  errorMessage,
  successMessage,
  subtotal,
  grandTotal,
  setLine,
  addLine,
  removeLine,
  setSignatureField,
}: InvoiceEditorFormProps) {
  const [numberMode, setNumberMode] = useState<"AUTO" | "MANUAL">(() => {
    return form.invoiceNumber ? "MANUAL" : "AUTO";
  });

  const paymentKind = useMemo(() => {
    const t = form.paymentTerms;
    if ((PAYMENT_OPTIONS as readonly string[]).includes(t)) return t;
    return "__other__";
  }, [form.paymentTerms]);

  const autoInvoiceNumberExample = useMemo(() => {
    const stem = normalizeInvoicePrefixStem(form.invoiceNumberPrefix);
    const prefix = toPreviewPrefix(stem);
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    return `${prefix}${yyyymm}-00001`;
  }, [form.invoiceNumberPrefix]);

  const itemTotals = useMemo(
    () => form.items.map((item) => Number((item.quantity * item.unitPrice).toFixed(2))),
    [form.items],
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">

      {/* ── ข้อมูลเอกสาร ── */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>ข้อมูลเอกสาร</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">เลขที่ใบเสร็จ</p>
            <p className="mt-1 text-xs text-indigo-800/70">
              เลือกอย่างใดอย่างหนึ่ง: กรอกเลขเองทั้งหมด หรือเว้นว่างแล้วตั้งแค่ prefix ให้ระบบต่อท้ายปีเดือนและลำดับให้
            </p>

            {/* Toggle Segmented Control */}
            <div className="mt-3 flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 w-fit border border-zinc-200/50">
              <button
                type="button"
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  numberMode === "AUTO"
                    ? "bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
                onClick={() => {
                  setNumberMode("AUTO");
                  setForm((prev) => ({ ...prev, invoiceNumber: "" }));
                }}
              >
                รันเลขที่อัตโนมัติ
              </button>
              <button
                type="button"
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  numberMode === "MANUAL"
                    ? "bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
                onClick={() => setNumberMode("MANUAL")}
              >
                กรอกเลขที่เอง
              </button>
            </div>

            <div className="mt-3">
              {numberMode === "MANUAL" ? (
                <label className="block text-sm text-zinc-800">
                  <span className="font-medium">กรอกเลขที่เอง</span>
                  <span className="text-red-500 ml-1 font-bold">*</span>
                  <input
                    className={inputClass}
                    value={form.invoiceNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                    placeholder="เช่น QT-105"
                    required={numberMode === "MANUAL"}
                  />
                  <span className="mt-1 block text-xs text-zinc-500">ถ้ากรอกช่องนี้ ระบบจะใช้เลขนี้ตามที่พิมพ์</span>
                </label>
              ) : (
                <label className="block text-sm text-zinc-800">
                  <span className="font-medium">กำหนดเลขที่ใบเสร็จอัตโนมัติ (Prefix)</span>
                  <span className="text-red-500 ml-1 font-bold">*</span>
                  <input
                    className={`${inputClass} font-mono`}
                    value={form.invoiceNumberPrefix}
                    onChange={(e) => setForm((prev) => ({ ...prev, invoiceNumberPrefix: e.target.value }))}
                    onBlur={() => {
                      const next = normalizeInvoicePrefixStem(form.invoiceNumberPrefix);
                      if (next !== form.invoiceNumberPrefix) {
                        setForm((prev) => ({ ...prev, invoiceNumberPrefix: next }));
                      }
                    }}
                    placeholder="RC- หรือ INV-"
                    inputMode="text"
                    autoComplete="off"
                    required={numberMode === "AUTO"}
                  />
                  <span className="mt-1.5 flex flex-col gap-0.5 text-xs text-zinc-600">
                    <span>
                      ใส่เฉพาะต้นทาง เช่น{" "}
                      <kbd className="rounded bg-white px-1 py-0.5 font-mono text-zinc-800 ring-1 ring-zinc-200">RC-</kbd>{" "}
                      ไม่ต้องใส่ปีเดือนหรือเลขลำดับ
                    </span>
                    <span>
                      ตัวอย่างที่จะได้:{" "}
                      <span className="font-mono font-semibold text-indigo-700">{autoInvoiceNumberExample}</span>
                    </span>
                  </span>
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:col-span-2 md:grid-cols-[minmax(0,11.5rem)_minmax(0,1fr)_minmax(0,5.75rem)] md:items-start">
            <label className="text-sm text-zinc-700">
              <span className="font-medium">วันที่เอกสาร</span>
              <span className="text-red-500 ml-1 font-bold">*</span>
              <input
                type="date"
                className={inputClass}
                value={form.documentDate}
                onChange={(e) => setForm((prev) => ({ ...prev, documentDate: e.target.value }))}
                required
              />
            </label>
            <label className="min-w-0 text-sm text-zinc-700">
              <span className="font-medium">เงื่อนไขการชำระเงิน</span>
              <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 sm:min-w-48 sm:flex-1"
                  value={paymentKind}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__other__") {
                      setForm((prev) => ({
                        ...prev,
                        paymentTerms: (PAYMENT_OPTIONS as readonly string[]).includes(prev.paymentTerms)
                          ? ""
                          : prev.paymentTerms,
                      }));
                    } else {
                      setForm((prev) => ({ ...prev, paymentTerms: v }));
                    }
                  }}
                >
                  {PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                  <option value="__other__">อื่นๆ</option>
                </select>
                {paymentKind === "__other__" ? (
                  <input
                    className="w-full min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                    value={form.paymentTerms}
                    onChange={(e) => setForm((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                    placeholder="ระบุเงื่อนไขการชำระเงิน"
                  />
                ) : null}
              </div>
            </label>
            <label className="text-sm text-zinc-700">
              <span className="font-medium">เครดิต (วัน)</span>
              <input
                type="number"
                min={0}
                className={`${inputClass} max-w-32 md:max-w-none`}
                value={form.creditDays}
                onChange={(e) => setForm((prev) => ({ ...prev, creditDays: Number(e.target.value) || 0 }))}
              />
            </label>
          </div>
        </div>
      </section>

      {/* ── ข้อมูลผู้ขาย ── */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>ข้อมูลผู้ขาย</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            <span className="font-medium">ชื่อบริษัทผู้ขาย</span>
            <span className="text-red-500 ml-1 font-bold">*</span>
            <input
              className={inputClass}
              value={form.sellerCompanyName}
              onChange={(e) => setForm((prev) => ({ ...prev, sellerCompanyName: e.target.value }))}
              required
            />
          </label>
          <label className="text-sm text-zinc-700">
            <span className="font-medium">เลขประจำตัวผู้เสียภาษีผู้ขาย</span>
            <input
              className={inputClass}
              value={form.sellerTaxId}
              onChange={(e) => setForm((prev) => ({ ...prev, sellerTaxId: e.target.value }))}
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            <span className="font-medium">ที่อยู่ผู้ขาย</span>
            <span className="text-red-500 ml-1 font-bold">*</span>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={form.sellerAddress}
              onChange={(e) => setForm((prev) => ({ ...prev, sellerAddress: e.target.value }))}
              required
            />
          </label>
          <label className="text-sm text-zinc-700">
            <span className="font-medium">เบอร์โทรผู้ขาย</span>
            <input
              className={inputClass}
              value={form.sellerPhone}
              onChange={(e) => setForm((prev) => ({ ...prev, sellerPhone: e.target.value }))}
            />
          </label>
          <label className="text-sm text-zinc-700">
            <span className="font-medium">อีเมลผู้ขาย</span>
            <input
              type="email"
              className={inputClass}
              value={form.sellerEmail}
              onChange={(e) => setForm((prev) => ({ ...prev, sellerEmail: e.target.value }))}
            />
          </label>
        </div>
      </section>

      {/* ── ข้อมูลผู้ซื้อ ── */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>ข้อมูลผู้ซื้อ</h2>
        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 accent-indigo-600"
            checked={form.includeBuyer}
            onChange={(e) => setForm((prev) => ({ ...prev, includeBuyer: e.target.checked }))}
          />
          <span className="font-medium">ใช้งานข้อมูลผู้ซื้อบนใบเสร็จและ PDF</span>
        </label>
        {form.includeBuyer ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-zinc-700">
              <span className="font-medium">ชื่อบริษัทผู้ซื้อ</span>
              <span className="text-red-500 ml-1 font-bold">*</span>
              <input
                className={inputClass}
                value={form.buyerCompanyName}
                onChange={(e) => setForm((prev) => ({ ...prev, buyerCompanyName: e.target.value }))}
                required={form.includeBuyer}
              />
            </label>
            <label className="text-sm text-zinc-700">
              <span className="font-medium">เลขประจำตัวผู้เสียภาษีผู้ซื้อ</span>
              <input
                className={inputClass}
                value={form.buyerTaxId}
                onChange={(e) => setForm((prev) => ({ ...prev, buyerTaxId: e.target.value }))}
              />
            </label>
            <label className="text-sm text-zinc-700 md:col-span-2">
              <span className="font-medium">ที่อยู่ผู้ซื้อ</span>
              <span className="text-red-500 ml-1 font-bold">*</span>
              <textarea
                className={`${inputClass} resize-none`}
                rows={2}
                value={form.buyerAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, buyerAddress: e.target.value }))}
                required={form.includeBuyer}
              />
            </label>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">ปิดอยู่ — ตัวอย่างและ PDF จะไม่แสดงข้อมูลผู้ซื้อ</p>
        )}
      </section>

      {/* ── รายการสินค้า/บริการ ── */}
      <section className={sectionCardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={sectionTitleClass}>รายการสินค้า/บริการ</h2>
          <button type="button" onClick={addLine} className={appBtnSecondaryClass}>
            <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            เพิ่มรายการ
          </button>
        </div>

        {/* Table Header */}
        <div className="mt-4 grid grid-cols-[1fr_88px_116px_88px_44px] gap-2 border-b border-zinc-200 pb-2 px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <p>รายละเอียด <span className="text-red-500 font-bold">*</span></p>
          <p className="text-right">จำนวน</p>
          <p className="text-right">ราคา/หน่วย</p>
          <p className="text-right text-indigo-600">รวม</p>
          <p className="sr-only">จัดการ</p>
        </div>

        {/* Table Rows */}
        <div className="mt-2 space-y-2">
          {form.items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_88px_116px_88px_44px] items-center gap-2">
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                placeholder="รายละเอียดรายการ"
                value={item.description}
                onChange={(e) => setLine(index, "description", e.target.value)}
                required
              />
              <input
                type="number"
                min={0.01}
                step={0.01}
                className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2 text-right text-sm text-zinc-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                value={item.quantity}
                onChange={(e) => setLine(index, "quantity", e.target.value)}
              />
              <input
                type="number"
                min={0}
                step={0.01}
                className="w-full rounded-xl border border-zinc-200 bg-white px-2 py-2 text-right text-sm text-zinc-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                value={item.unitPrice}
                onChange={(e) => setLine(index, "unitPrice", e.target.value)}
              />
              <p className="rounded-xl bg-indigo-50 px-2 py-2 text-right text-sm font-medium text-indigo-700 select-none">
                {formatMoney(itemTotals[index] ?? 0)}
              </p>
              <button
                type="button"
                onClick={() => removeLine(index)}
                className={dangerIconBtnClass}
                aria-label={`ลบรายการที่ ${index + 1}`}
              >
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── สรุปยอดและสถานะ ── */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>สรุปยอดและสถานะ</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            <span className="font-medium">ส่วนลดรวม</span>
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass}
              value={form.discountTotal}
              onChange={(e) => setForm((prev) => ({ ...prev, discountTotal: Number(e.target.value) || 0 }))}
            />
          </label>
          <label className="text-sm text-zinc-700">
            <span className="font-medium">สถานะเอกสาร</span>
            <select
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as InvoiceForm["status"] }))}
            >
              <option value="DRAFT">ฉบับร่าง</option>
              <option value="ISSUED">ออกเอกสารแล้ว</option>
              <option value="CANCELLED">ยกเลิก</option>
            </select>
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            <span className="font-medium">จำนวนเงินตัวอักษร</span>
            <input
              className={inputClass}
              value={form.amountInWords}
              onChange={(e) => setForm((prev) => ({ ...prev, amountInWords: e.target.value }))}
            />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            <span className="font-medium">หมายเหตุ</span>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              value={form.note}
              onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
            />
          </label>
        </div>

        {/* ยอดรวม */}
        <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-600">ยอดรวมก่อนหักส่วนลด</span>
              <strong className="text-zinc-800">{formatMoney(subtotal)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-600">ส่วนลดรวม</span>
              <strong className="text-zinc-800">{formatMoney(form.discountTotal)}</strong>
            </div>
            <div className="flex justify-between border-t border-zinc-300 pt-3 text-base">
              <span className="font-bold text-zinc-900">ยอดชำระสุทธิ</span>
              <strong className="text-lg font-bold text-indigo-700">{formatMoney(grandTotal)}</strong>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="mt-0.5 h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        ) : null}
        {successMessage ? (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            <svg className="mt-0.5 h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${appBtnSuccessClass} flex-1 py-3 text-base`}
          >
            {isSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                กำลังบันทึก...
              </>
            ) : submitLabel}
          </button>
          {exportId ? (
            <a
              href={`/api/invoices/${exportId}/export-pdf`}
              target="_blank"
              rel="noreferrer"
              className={exportPdfClass}
            >
              <svg className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm4.75 11.75a.75.75 0 001.5 0v-2.546l.943 1.048a.75.75 0 101.114-1.004l-2.25-2.5a.75.75 0 00-1.114 0l-2.25 2.5a.75.75 0 101.114 1.004l.943-1.048v2.546z" clipRule="evenodd" />
              </svg>
              ส่งออก PDF
            </a>
          ) : null}
        </div>
      </section>

      {/* ── ลายเซ็น (Optional) ── */}
      <details className={sectionCardClass}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className={sectionTitleClass}>ลายเซ็นและชื่อผู้ลงนาม <span className="ml-1 text-sm font-normal text-zinc-400">(ไม่บังคับ)</span></span>
          <svg className="h-5 w-5 shrink-0 text-zinc-400 transition [[open]>summary_&]:rotate-180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </summary>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {signatureBlocks.map((block) => (
            <div key={block.key} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
              <p className="mb-3 text-sm font-semibold text-zinc-800">{block.label}</p>
              <label className="mb-1 block text-xs font-medium text-zinc-600">ข้อความบนเส้นประ</label>
              <input
                className="mb-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                value={form.signatures[block.key].dottedText}
                onChange={(e) => setSignatureField(block.key, "dottedText", e.target.value)}
                placeholder="เช่น ผู้จัดการฝ่ายบัญชี"
              />
              <label className="mb-1 block text-xs font-medium text-zinc-600">ข้อความในวงเล็บ</label>
              <input
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                value={form.signatures[block.key].bracketText}
                onChange={(e) => setSignatureField(block.key, "bracketText", e.target.value)}
                placeholder="เช่น นายสมชาย ใจดี"
              />
            </div>
          ))}
        </div>
      </details>
    </form>
  );
}
