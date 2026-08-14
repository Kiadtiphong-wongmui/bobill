"use client";

import { useMemo } from "react";

import AppPageShell from "@/components/layout/app-page-shell";
import InvoiceEditor from "@/components/invoices/invoice-editor";
import { buildDefaultInvoiceForm } from "@/lib/invoices/default-invoice-form";
import { mergeDefaultsIntoForm } from "@/lib/invoices/invoice-new-defaults";

export default function NewInvoicePage() {
  const initialForm = useMemo(() => mergeDefaultsIntoForm(buildDefaultInvoiceForm()), []);

  return (
    <AppPageShell wide>
      <InvoiceEditor
        title="สร้างใบเสร็จ / ออกบิล"
        submitLabel="บันทึกใบเสร็จ"
        initialForm={initialForm}
        enableSaveDefaults
      />
    </AppPageShell>
  );
}
