"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { QuotationEditorForm, type SignatureKey } from "@/components/quotations/quotation-editor-form";
import { QuotationEditorPreview } from "@/components/quotations/quotation-editor-preview";
import { createQuotation, updateQuotation } from "@/lib/quotations/api";
import { defaultEmptyLine } from "@/lib/quotations/default-quotation-form";
import { mapQuotationToForm } from "@/lib/quotations/form-mapper";
import type { QuotationApi, QuotationForm } from "@/lib/quotations/types";

type Props = {
  title: string;
  submitLabel: string;
  initialForm: QuotationForm;
  quotationId?: number;
};

const backLinkClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2";

const round2 = (value: number) => Number(value.toFixed(2));

export default function QuotationEditor({ title, submitLabel, initialForm, quotationId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<QuotationForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState<QuotationApi | null>(null);

  const itemTotals = useMemo(() => form.items.map((item) => round2(item.quantity * item.unitPrice)), [form.items]);
  const subtotal = useMemo(() => round2(itemTotals.reduce((sum, value) => sum + value, 0)), [itemTotals]);
  const afterDiscount = round2(subtotal - form.discountTotal);
  const vatAmount = form.vatEnabled ? round2((afterDiscount * form.vatRate) / 100) : 0;
  const grandTotal = round2(afterDiscount + vatAmount);

  const setLine = (index: number, key: "description" | "quantity" | "unitPrice", value: string) => {
    setForm((prev) => {
      const items = [...prev.items];
      const current = items[index];
      if (!current) return prev;
      if (key === "description") {
        items[index] = { ...current, description: value };
      } else {
        const parsed = Number(value);
        items[index] = { ...current, [key]: Number.isFinite(parsed) ? parsed : 0 };
      }
      return { ...prev, items };
    });
  };

  const addLine = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...defaultEmptyLine }] }));
  const removeLine = (index: number) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items,
    }));

  const setSignatureField = (
    key: SignatureKey,
    field: "dottedText" | "bracketText" | "imageDataUrl",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      signatures: { ...prev.signatures, [key]: { ...prev.signatures[key], [field]: value } },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (form.includeBuyer && (!form.buyerCompanyName.trim() || !form.buyerAddress.trim())) {
      setErrorMessage("กรุณากรอกข้อมูลลูกค้า หรือปิดการแสดงข้อมูลลูกค้า");
      return;
    }
    if (form.items.some((item) => item.description.trim().length === 0 || item.quantity <= 0 || item.unitPrice < 0)) {
      setErrorMessage("กรุณากรอกรายการสินค้า/บริการให้ถูกต้อง");
      return;
    }
    if (afterDiscount < 0) {
      setErrorMessage("ส่วนลดต้องไม่มากกว่ายอดรวมก่อนหักส่วนลด");
      return;
    }
    if (form.validUntil < form.documentDate) {
      setErrorMessage("วันที่ใช้ได้ถึงต้องไม่ก่อนวันที่เอกสาร");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = quotationId ? await updateQuotation(quotationId, form) : await createQuotation(form);
      setSaved(result);
      setSuccessMessage(`บันทึกใบเสนอราคา ${result.quotationNumber} เรียบร้อยแล้ว`);
      setForm(mapQuotationToForm(result));
      if (!quotationId) {
        router.push(`/quotations/${result.id}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถบันทึกใบเสนอราคาได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full text-zinc-900 dark:text-zinc-100">
      <div className="flex w-full flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              กรอกฟอร์มด้านซ้าย และตรวจตัวอย่างเอกสารด้านขวาแบบเรียลไทม์
            </p>
          </div>
          <Link href="/quotations" className={backLinkClass}>
            กลับรายการใบเสนอราคา
          </Link>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <QuotationEditorForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            exportId={saved?.id ?? quotationId}
            errorMessage={errorMessage}
            successMessage={successMessage}
            itemTotals={itemTotals}
            subtotal={subtotal}
            vatAmount={vatAmount}
            grandTotal={grandTotal}
            setLine={setLine}
            addLine={addLine}
            removeLine={removeLine}
            setSignatureField={setSignatureField}
          />
          <QuotationEditorPreview
            form={form}
            itemTotals={itemTotals}
            subtotal={subtotal}
            vatAmount={vatAmount}
            grandTotal={grandTotal}
          />
        </div>
      </div>
    </div>
  );
}
