import { appCardClass } from "@/components/layout/app-page-shell";
import { formatMoney } from "@/lib/format/money";
import type { QuotationForm } from "@/lib/quotations/types";

export type QuotationEditorPreviewProps = {
  form: QuotationForm;
  itemTotals: number[];
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
};

export function QuotationEditorPreview({ form, itemTotals, subtotal, vatAmount, grandTotal }: QuotationEditorPreviewProps) {
  return (
    <section className={`${appCardClass} lg:sticky lg:top-4 lg:h-fit`}>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">ตัวอย่างเอกสาร</h2>
        <span className="ml-auto rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
          Live Preview
        </span>
      </div>

      <div className="rounded-xl border border-zinc-300 bg-white shadow-sm">
        <div className="rounded-t-xl border-b border-zinc-200 bg-indigo-600 px-5 py-3">
          <p className="text-center text-base font-bold tracking-wide text-white">ใบเสนอราคา</p>
        </div>

        <div className="p-4 text-xs">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ผู้เสนอราคา</p>
              <p className="font-semibold text-zinc-900">{form.sellerCompanyName || "—"}</p>
              {form.sellerTaxId ? <p className="text-zinc-600">เลขภาษี: {form.sellerTaxId}</p> : null}
              {form.sellerAddress ? <p className="leading-relaxed text-zinc-600">{form.sellerAddress}</p> : null}
              {form.sellerPhone ? <p className="text-zinc-600">โทร: {form.sellerPhone}</p> : null}
              {form.sellerEmail ? <p className="text-zinc-600">{form.sellerEmail}</p> : null}
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">ข้อมูลเอกสาร</p>
              <p className="font-mono font-semibold text-indigo-700">{form.quotationNumber || "(อัตโนมัติ)"}</p>
              <p className="text-zinc-600">วันที่: {form.documentDate || "—"}</p>
              <p className="text-zinc-600">ใช้ได้ถึง: {form.validUntil || "—"}</p>
              {form.paymentTerms ? <p className="text-zinc-600">ชำระ: {form.paymentTerms}</p> : null}
            </div>
          </div>

          {form.includeBuyer ? (
            <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-indigo-500">ลูกค้า</p>
              <p className="font-semibold text-zinc-900">{form.buyerCompanyName || "—"}</p>
              {form.buyerTaxId ? <p className="text-zinc-600">เลขภาษี: {form.buyerTaxId}</p> : null}
              {form.buyerAddress ? <p className="leading-relaxed text-zinc-600">{form.buyerAddress}</p> : null}
            </div>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-lg border border-zinc-200">
            <div className="grid grid-cols-[auto_1fr_60px_72px_72px] bg-indigo-50 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              <p className="border-r border-indigo-100 px-2 py-2 text-center">#</p>
              <p className="border-r border-indigo-100 px-2 py-2">รายการ</p>
              <p className="border-r border-indigo-100 px-2 py-2 text-right">จำนวน</p>
              <p className="border-r border-indigo-100 px-2 py-2 text-right">ราคา/หน่วย</p>
              <p className="px-2 py-2 text-right">รวม</p>
            </div>
            {form.items.map((item, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-[auto_1fr_60px_72px_72px] border-t border-zinc-100 ${idx % 2 === 1 ? "bg-zinc-50/70" : "bg-white"}`}
              >
                <p className="border-r border-zinc-100 px-2 py-1.5 text-center text-zinc-500">{idx + 1}</p>
                <p className="border-r border-zinc-100 px-2 py-1.5 text-zinc-800">
                  {item.description || <span className="italic text-zinc-400">—</span>}
                </p>
                <p className="border-r border-zinc-100 px-2 py-1.5 text-right text-zinc-700">{formatMoney(item.quantity)}</p>
                <p className="border-r border-zinc-100 px-2 py-1.5 text-right text-zinc-700">{formatMoney(item.unitPrice)}</p>
                <p className="px-2 py-1.5 text-right font-medium text-indigo-700">{formatMoney(itemTotals[idx] ?? 0)}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-56 space-y-1.5 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex justify-between text-zinc-600">
                <span>รวมเงิน</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              {form.discountTotal > 0 ? (
                <div className="flex justify-between text-zinc-600">
                  <span>ส่วนลด</span>
                  <span>-{formatMoney(form.discountTotal)}</span>
                </div>
              ) : null}
              {form.vatEnabled ? (
                <div className="flex justify-between text-zinc-600">
                  <span>VAT {form.vatRate}%</span>
                  <span>{formatMoney(vatAmount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-zinc-300 pt-2 font-bold text-indigo-700">
                <span>รวมทั้งสิ้น</span>
                <span>{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </div>

          {form.note ? <p className="mt-3 whitespace-pre-wrap text-red-600">* {form.note}</p> : null}
        </div>
      </div>
    </section>
  );
}
