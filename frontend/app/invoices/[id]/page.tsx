import AppPageShell from "@/components/layout/app-page-shell";
import InvoiceEditor from "@/components/invoices/invoice-editor";
import { mapInvoiceToForm } from "@/lib/invoices/form-mapper";
import type { InvoiceApi } from "@/lib/invoices/types";
import { headers } from "next/headers";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditInvoicePage({ params }: Props) {
  const { id } = await params;
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const cookie = requestHeaders.get("cookie") ?? "";
  if (!host) {
    throw new Error("Unable to resolve request host");
  }

  const response = await fetch(`${protocol}://${host}/api/invoices/${Number(id)}`, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });
  const payload = (await response.json()) as InvoiceApi & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to load invoice");
  }
  const invoice = payload;
  const initialForm = mapInvoiceToForm(invoice);

  return (
    <AppPageShell wide>
      <InvoiceEditor
        title={`แก้ไขใบเสร็จ ${invoice.invoiceNumber}`}
        submitLabel="บันทึกการแก้ไข"
        invoiceId={invoice.id}
        initialForm={initialForm}
      />
    </AppPageShell>
  );
}
