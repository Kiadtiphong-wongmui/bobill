"use client";

import { useMemo } from "react";

import AppPageShell from "@/components/layout/app-page-shell";
import QuotationEditor from "@/components/quotations/quotation-editor";
import { buildDefaultQuotationForm } from "@/lib/quotations/default-quotation-form";

export default function NewQuotationPage() {
  const initialForm = useMemo(() => buildDefaultQuotationForm(), []);

  return (
    <AppPageShell wide>
      <QuotationEditor title="สร้างใบเสนอราคา" submitLabel="บันทึกใบเสนอราคา" initialForm={initialForm} />
    </AppPageShell>
  );
}
