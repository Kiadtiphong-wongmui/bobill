"use client";

import { useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import { appBtnSecondaryClass, appBtnSuccessClass, appControlClass } from "@/components/layout/app-page-shell";
import { formatMoney } from "@/lib/format/money";
import { normalizeInvoicePrefixStem } from "@/lib/invoices/invoice-prefix";
import type { QuotationForm } from "@/lib/quotations/types";

const PAYMENT_OPTIONS = ["โอนชำระผ่านบัญชี", "PromptPay", "เงินสด"] as const;

const signatureBlocks = [
  { key: "quotedBy", label: "ผู้เสนอราคา" },
  { key: "acceptedBy", label: "ผู้อนุมัติ" },
] as const;

export type SignatureKey = (typeof signatureBlocks)[number]["key"];

const sectionCardClass =
  "rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-lg shadow-indigo-950/5 backdrop-blur-sm [border-left-width:3px] border-l-indigo-500";
const sectionTitleClass = "text-lg font-bold text-zinc-900 dark:text-zinc-50";
const inputClass = `${appControlClass} mt-1`;
const lineInputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-2 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15";
const exportPdfClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:border-indigo-400 hover:bg-indigo-100 hover:text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2";

/** Match backend sanitize + hyphen rule for preview only. */
function toPreviewPrefix(stem: string): string {
  const safe = stem.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 24);
  if (!safe) return "QT-";
  return safe.endsWith("-") ? safe : `${safe}-`;
}

export type QuotationEditorFormProps = {
  form: QuotationForm;
  setForm: Dispatch<SetStateAction<QuotationForm>>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  isSubmitting: boolean;
  exportId?: number | undefined;
  errorMessage: string | null;
  successMessage: string | null;
  itemTotals: number[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  setLine: (index: number, key: "description" | "quantity" | "unitPrice", value: string) => void;
  addLine: () => void;
  removeLine: (index: number) => void;
  setSignatureField: (
    key: SignatureKey,
    field: "dottedText" | "bracketText" | "imageDataUrl",
    value: string,
  ) => void;
};

export function QuotationEditorForm({
  form,
  setForm,
  onSubmit,
  submitLabel,
  isSubmitting,
  exportId,
  errorMessage,
  successMessage,
  itemTotals,
  subtotal,
  vatAmount,
  grandTotal,
  setLine,
  addLine,
  removeLine,
  setSignatureField,
}: QuotationEditorFormProps) {
  const [numberMode, setNumberMode] = useState<"AUTO" | "MANUAL">(form.quotationNumber ? "MANUAL" : "AUTO");

  const paymentKind = (PAYMENT_OPTIONS as readonly string[]).includes(form.paymentTerms)
    ? form.paymentTerms
    : "__other__";

  const autoNumberExample = useMemo(() => {
    const prefix = toPreviewPrefix(normalizeInvoicePrefixStem(form.quotationNumberPrefix));
    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    return `${prefix}${yyyymm}-00001`;
  }, [form.quotationNumberPrefix]);

  const update = <K extends keyof QuotationForm>(key: K, value: QuotationForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const segmentClass = (active: boolean) =>
    `px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
      active
        ? "bg-white dark:bg-zinc-800 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm"
        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
    }`;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* ── ข้อมูลเอกสาร ── */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>ข้อมูลเอกสาร</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">เลขที่ใบเสนอราคา</p>
            <p className="mt-1 text-xs text-indigo-800/70">
              กรอกเลขเอง หรือเว้นว่างแล้วตั้ง prefix ให้ระบบต่อท้ายปีเดือนและลำดับให้
            </p>
            <div className="mt-3 flex w-fit gap-1 rounded-xl border border-zinc-200/50 bg-zinc-100 p-1 dark:bg-zinc-900">
              <button
                type="button"
                className={segmentClass(numberMode === "AUTO")}
                onClick={() => {
                  setNumberMode("AUTO");
                  update("quotationNumber", "");
                }}
              >
                รันเลขที่อัตโนมัติ
              </button>
              <button type="button" className={segmentClass(numberMode === "MANUAL")} onClick={() => setNumberMode("MANUAL")}>
                กรอกเลขที่เอง
              </button>
            </div>
            <div className="mt-3">
              {numberMode === "MANUAL" ? (
                <label className="block text-sm text-zinc-800">
                  <span className="font-medium">กรอกเลขที่เอง</span>
                  <span className="ml-1 font-bold text-red-500">*</span>
                  <input
                    className={inputClass}
                    value={form.quotationNumber}
                    onChange={(e) => update("quotationNumber", e.target.value)}
                    placeholder="เช่น QT-105"
                    required
                  />
                </label>
              ) : (
                <label className="block text-sm text-zinc-800">
                  <span className="font-medium">Prefix เลขที่อัตโนมัติ</span>
                  <input
                    className={`${inputClass} font-mono`}
                    value={form.quotationNumberPrefix}
                    onChange={(e) => update("quotationNumberPrefix", e.target.value)}
                    onBlur={() => update("quotationNumberPrefix", normalizeInvoicePrefixStem(form.quotationNumberPrefix))}
                    placeholder="QT-"
                    autoComplete="off"
                  />
                  <span className="mt-1.5 block text-xs text-zinc-600">
                    ตัวอย่างที่จะได้: <span className="font-mono font-semibold text-indigo-700">{autoNumberExample}</span>
                  </span>
                </label>
              )}
            </div>
          </div>

          <label className="text-sm text-zinc-700">
            <span className="font-medium">วันที่เอกสาร</span>
            <span className="ml-1 font-bold text-red-500">*</span>
            <input type="date" className={inputClass} value={form.documentDate} onChange={(e) => update("documentDate", e.target.value)} required />
          </label>
          <label className="text-sm text-zinc-700">
            <span className="font-medium">ใช้ได้ถึงวันที่</span>
            <span className="ml-1 font-bold text-red-500">*</span>
            <input
              type="date"
              className={inputClass}
              min={form.documentDate}
              value={form.validUntil}
              onChange={(e) => update("validUntil", e.target.value)}
              required
            />
          </label>
          <label className="min-w-0 text-sm text-zinc-700 md:col-span-2">
            <span className="font-medium">เงื่อนไขการชำระเงิน</span>
            <div className="mt-1 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <select
                className="w-full min-w-0 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 sm:min-w-48 sm:flex-1"
                value={paymentKind}
                onChange={(e) => update("paymentTerms", e.target.value === "__other__" ? "" : e.target.value)}
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
                  onChange={(e) => update("paymentTerms", e.target.value)}
                  placeholder="ระบุเงื่อนไขการชำระเงิน"
                />
              ) : null}
            </div>
          </label>
        </div>
      </section>

      {/* ── ข้อมูลผู้ขาย ── */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>ข้อมูลผู้เสนอราคา (ผู้ขาย)</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            <span className="font-medium">ชื่อบริษัท</span>
            <span className="ml-1 font-bold text-red-500">*</span>
            <input className={inputClass} value={form.sellerCompanyName} onChange={(e) => update("sellerCompanyName", e.target.value)} required />
          </label>
          <label className="text-sm text-zinc-700">
            <span className="font-medium">เลขประจำตัวผู้เสียภาษี</span>
            <input className={inputClass} value={form.sellerTaxId} onChange={(e) => update("sellerTaxId", e.target.value)} />
          </label>
          <label className="text-sm text-zinc-700 md:col-span-2">
            <span className="font-medium">ที่อยู่</span>
            <span className="ml-1 font-bold text-red-500">*</span>
            <textarea className={`${inputClass} resize-none`} rows={2} value={form.sellerAddress} onChange={(e) => update("sellerAddress", e.target.value)} required />
          </label>
          <label className="text-sm text-zinc-700">
            <span className="font-medium">เบอร์โทร</span>
            <input className={inputClass} value={form.sellerPhone} onChange={(e) => update("sellerPhone", e.target.value)} />
          </label>
          <label className="text-sm text-zinc-700">
            <span className="font-medium">อีเมล</span>
            <input type="email" className={inputClass} value={form.sellerEmail} onChange={(e) => update("sellerEmail", e.target.value)} />
          </label>
        </div>
      </section>

      {/* ── ข้อมูลลูกค้า ── */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>ข้อมูลลูกค้า</h2>
        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-zinc-300 accent-indigo-600"
            checked={form.includeBuyer}
            onChange={(e) => update("includeBuyer", e.target.checked)}
          />
          <span className="font-medium">แสดงข้อมูลลูกค้าบนใบเสนอราคาและ PDF</span>
        </label>
        {form.includeBuyer ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="text-sm text-zinc-700">
              <span className="font-medium">ชื่อลูกค้า / บริษัท</span>
              <span className="ml-1 font-bold text-red-500">*</span>
              <input className={inputClass} value={form.buyerCompanyName} onChange={(e) => update("buyerCompanyName", e.target.value)} required />
            </label>
            <label className="text-sm text-zinc-700">
              <span className="font-medium">เลขประจำตัวผู้เสียภาษี</span>
              <input className={inputClass} value={form.buyerTaxId} onChange={(e) => update("buyerTaxId", e.target.value)} />
            </label>
            <label className="text-sm text-zinc-700 md:col-span-2">
              <span className="font-medium">ที่อยู่ลูกค้า</span>
              <span className="ml-1 font-bold text-red-500">*</span>
              <textarea className={`${inputClass} resize-none`} rows={2} value={form.buyerAddress} onChange={(e) => update("buyerAddress", e.target.value)} required />
            </label>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">ปิดอยู่ — ตัวอย่างและ PDF จะไม่แสดงข้อมูลลูกค้า</p>
        )}
      </section>

      {/* ── รายการ ── */}
      <section className={sectionCardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={sectionTitleClass}>รายการสินค้า/บริการ</h2>
          <button type="button" onClick={addLine} className={appBtnSecondaryClass}>
            + เพิ่มรายการ
          </button>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_88px_116px_88px_44px] gap-2 border-b border-zinc-200 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          <p>
            รายละเอียด <span className="font-bold text-red-500">*</span>
          </p>
          <p className="text-right">จำนวน</p>
          <p className="text-right">ราคา/หน่วย</p>
          <p className="text-right text-indigo-600">รวม</p>
          <p className="sr-only">จัดการ</p>
        </div>

        <div className="mt-2 space-y-2">
          {form.items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_88px_116px_88px_44px] items-center gap-2">
              <input
                className={`${lineInputClass} px-3`}
                placeholder="รายละเอียดรายการ"
                value={item.description}
                onChange={(e) => setLine(index, "description", e.target.value)}
                required
              />
              <input
                type="number"
                min={0.01}
                step={0.01}
                className={`${lineInputClass} text-right`}
                value={item.quantity}
                onChange={(e) => setLine(index, "quantity", e.target.value)}
              />
              <input
                type="number"
                min={0}
                step={0.01}
                className={`${lineInputClass} text-right`}
                value={item.unitPrice}
                onChange={(e) => setLine(index, "unitPrice", e.target.value)}
              />
              <p className="select-none rounded-xl bg-indigo-50 px-2 py-2 text-right text-sm font-medium text-indigo-700">
                {formatMoney(itemTotals[index] ?? 0)}
              </p>
              <button
                type="button"
                onClick={() => removeLine(index)}
                disabled={form.items.length <= 1}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-30"
                aria-label={`ลบรายการที่ ${index + 1}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── สรุปยอด ── */}
      <section className={sectionCardClass}>
        <h2 className={sectionTitleClass}>สรุปยอด</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-zinc-700">
            <span className="font-medium">ส่วนลดรวม</span>
            <input
              type="number"
              min={0}
              step={0.01}
              className={inputClass}
              value={form.discountTotal}
              onChange={(e) => update("discountTotal", Number(e.target.value) || 0)}
            />
          </label>
          <div className="text-sm text-zinc-700">
            <label className="flex cursor-pointer items-center gap-2.5 pt-6">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-300 accent-indigo-600"
                checked={form.vatEnabled}
                onChange={(e) => update("vatEnabled", e.target.checked)}
              />
              <span className="font-medium">คิดภาษีมูลค่าเพิ่ม (VAT)</span>
              {form.vatEnabled ? (
                <span className="ml-auto flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    aria-label="อัตรา VAT (%)"
                    className="w-20 rounded-xl border border-zinc-200 bg-white px-2 py-1.5 text-right text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                    value={form.vatRate}
                    onChange={(e) => update("vatRate", Number(e.target.value) || 0)}
                  />
                  %
                </span>
              ) : null}
            </label>
          </div>
          <label className="text-sm text-zinc-700 md:col-span-2">
            <span className="font-medium">หมายเหตุ</span>
            <textarea
              className={`${inputClass} resize-none`}
              rows={2}
              placeholder="เช่น ราคานี้รวมค่าขนส่ง (แสดงใต้ตารางรายการเป็นสีแดง)"
              value={form.note}
              onChange={(e) => update("note", e.target.value)}
            />
          </label>
        </div>

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
            {form.vatEnabled ? (
              <div className="flex justify-between">
                <span className="text-zinc-600">ภาษีมูลค่าเพิ่ม {form.vatRate}%</span>
                <strong className="text-zinc-800">{formatMoney(vatAmount)}</strong>
              </div>
            ) : null}
            <div className="flex justify-between border-t border-zinc-300 pt-3 text-base">
              <span className="font-bold text-zinc-900">ยอดรวมสุทธิ</span>
              <strong className="text-lg font-bold text-indigo-700">{formatMoney(grandTotal)}</strong>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {errorMessage}
          </div>
        ) : null}
        {successMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status">
            {successMessage}
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button type="submit" disabled={isSubmitting} className={`${appBtnSuccessClass} flex-1 py-3 text-base`}>
            {isSubmitting ? "กำลังบันทึก..." : submitLabel}
          </button>
          {exportId ? (
            <a href={`/api/quotations/${exportId}/export-pdf`} target="_blank" rel="noreferrer" className={exportPdfClass}>
              ส่งออก PDF
            </a>
          ) : null}
        </div>
      </section>

      {/* ── ลายเซ็น ── */}
      <details className={sectionCardClass}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
          <span className={sectionTitleClass}>
            ลายเซ็นและชื่อผู้ลงนาม <span className="ml-1 text-sm font-normal text-zinc-400">(ไม่บังคับ)</span>
          </span>
        </summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {signatureBlocks.map((block) => (
            <div key={block.key} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
              <p className="mb-3 text-sm font-semibold text-zinc-800">{block.label}</p>
              <label className="mb-1 block text-xs font-medium text-zinc-600">ข้อความบนเส้นประ</label>
              <input
                className="mb-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15"
                value={form.signatures[block.key].dottedText}
                onChange={(e) => setSignatureField(block.key, "dottedText", e.target.value)}
                placeholder="เช่น ผู้จัดการฝ่ายขาย"
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
