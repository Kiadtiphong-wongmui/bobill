"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { InvoiceEditorForm } from "@/components/invoices/invoice-editor-form";
import { InvoiceEditorHeader } from "@/components/invoices/invoice-editor-header";
import { InvoiceEditorPreview } from "@/components/invoices/invoice-editor-preview";
import { createInvoice, updateInvoice } from "@/lib/invoices/api";
import {
  buildDefaultInvoiceForm,
  defaultEmptyLine,
  defaultInvoiceForm,
} from "@/lib/invoices/default-invoice-form";
import { mapInvoiceToForm } from "@/lib/invoices/form-mapper";
import {
  saveInvoiceNewDefaults,
  type InvoiceDefaultsSection,
} from "@/lib/invoices/invoice-new-defaults";
import type { InvoiceApi, InvoiceForm } from "@/lib/invoices/types";

export { buildDefaultInvoiceForm, defaultInvoiceForm };

type Props = {
  title: string;
  submitLabel: string;
  initialForm: InvoiceForm;
  invoiceId?: number;
  /** When true, show actions to persist the current section as defaults for new invoices (localStorage). */
  enableSaveDefaults?: boolean;
};

export default function InvoiceEditor({
  title,
  submitLabel,
  initialForm,
  invoiceId,
  enableSaveDefaults = false,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<InvoiceForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedInvoice, setSavedInvoice] = useState<InvoiceApi | null>(null);
  const [defaultsToast, setDefaultsToast] = useState<string | null>(null);
  const defaultsToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (defaultsToastTimerRef.current) clearTimeout(defaultsToastTimerRef.current);
    };
  }, []);

  const showDefaultsSavedToast = () => {
    if (defaultsToastTimerRef.current) clearTimeout(defaultsToastTimerRef.current);
    setDefaultsToast("บันทึกค่าเริ่มต้นสำเร็จ — จะใช้เมื่อสร้างบิลใหม่ครั้งถัดไป");
    defaultsToastTimerRef.current = setTimeout(() => {
      setDefaultsToast(null);
      defaultsToastTimerRef.current = null;
    }, 4200);
  };

  const dismissDefaultsToast = () => {
    if (defaultsToastTimerRef.current) {
      clearTimeout(defaultsToastTimerRef.current);
      defaultsToastTimerRef.current = null;
    }
    setDefaultsToast(null);
  };

  const itemTotals = useMemo(
    () => form.items.map((item) => Number((item.quantity * item.unitPrice).toFixed(2))),
    [form.items],
  );
  const subtotal = useMemo(
    () => Number(itemTotals.reduce((sum, itemTotal) => sum + itemTotal, 0).toFixed(2)),
    [itemTotals],
  );
  const grandTotal = useMemo(() => Number((subtotal - form.discountTotal).toFixed(2)), [subtotal, form.discountTotal]);

  const saveDefaultsSection = (section: InvoiceDefaultsSection) => {
    saveInvoiceNewDefaults(section, form);
    setErrorMessage(null);
    showDefaultsSavedToast();
  };

  const setLine = (index: number, key: "description" | "quantity" | "unitPrice", value: string) => {
    setForm((prev) => {
      const nextItems = [...prev.items];
      if (key === "description") {
        nextItems[index] = { ...nextItems[index], description: value };
      } else {
        const parsed = Number(value);
        nextItems[index] = {
          ...nextItems[index],
          [key]: Number.isFinite(parsed) ? parsed : 0,
        };
      }
      return { ...prev, items: nextItems };
    });
  };

  const addLine = () => setForm((prev) => ({ ...prev, items: [...prev.items, { ...defaultEmptyLine }] }));
  const removeLine = (index: number) =>
    setForm((prev) => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items,
    }));

  const setSignatureField = (
    key: "approvedBy" | "receivedBy" | "payer",
    field: "dottedText" | "bracketText" | "imageDataUrl",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      signatures: {
        ...prev.signatures,
        [key]: {
          ...prev.signatures[key],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (form.includeBuyer) {
      if (!form.buyerCompanyName.trim() || !form.buyerAddress.trim()) {
        setErrorMessage("กรุณากรอกข้อมูลผู้ซื้อ หรือปิดการใช้งานข้อมูลผู้ซื้อ");
        return;
      }
    }
    if (form.items.some((item) => item.description.trim().length === 0 || item.quantity <= 0 || item.unitPrice < 0)) {
      setErrorMessage("กรุณากรอกรายการสินค้า/บริการให้ถูกต้อง");
      return;
    }
    if (grandTotal < 0) {
      setErrorMessage("ส่วนลดต้องไม่มากกว่ายอดรวมก่อนหักส่วนลด");
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = invoiceId
        ? await updateInvoice(invoiceId, form)
        : await createInvoice(form);
      setSavedInvoice(saved);
      setSuccessMessage(`บันทึกใบเสร็จ ${saved.invoiceNumber} เรียบร้อยแล้ว`);
      setForm(mapInvoiceToForm(saved));
      if (!invoiceId && saved.id) {
        router.push(`/invoices/${saved.id}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถบันทึกใบเสร็จได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportId = savedInvoice?.id ?? invoiceId;

  return (
    <div className="w-full text-zinc-900 dark:text-zinc-100">
      <div className="flex w-full flex-col gap-5">
        <InvoiceEditorHeader
          title={title}
          enableSaveDefaults={enableSaveDefaults}
          onSaveDefaultsAll={() => saveDefaultsSection("all")}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <InvoiceEditorForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmit}
            submitLabel={submitLabel}
            isSubmitting={isSubmitting}
            exportId={exportId}
            errorMessage={errorMessage}
            successMessage={successMessage}
            subtotal={subtotal}
            grandTotal={grandTotal}
            setLine={setLine}
            addLine={addLine}
            removeLine={removeLine}
            setSignatureField={setSignatureField}
          />

          <InvoiceEditorPreview form={form} itemTotals={itemTotals} subtotal={subtotal} grandTotal={grandTotal} />
        </div>
      </div>

      {defaultsToast ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex justify-center px-4 pb-6 sm:pb-8"
          aria-live="polite"
        >
          <div
            role="alert"
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-600 px-4 py-3.5 text-white shadow-2xl ring-2 ring-emerald-500/30"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path
                  fillRule="evenodd"
                  d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-snug">{defaultsToast}</p>
            <button
              type="button"
              onClick={dismissDefaultsToast}
              className="shrink-0 rounded-lg p-1.5 text-white/90 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
              aria-label="ปิดการแจ้งเตือน"
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
