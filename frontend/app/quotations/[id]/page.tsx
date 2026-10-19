import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AppPageShell from "@/components/layout/app-page-shell";
import QuotationEditor from "@/components/quotations/quotation-editor";
import { mapQuotationToForm } from "@/lib/quotations/form-mapper";
import type { QuotationApi } from "@/lib/quotations/types";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditQuotationPage({ params }: Props) {
  const { id } = await params;
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const cookie = requestHeaders.get("cookie") ?? "";
  if (!host) {
    throw new Error("Unable to resolve request host");
  }

  const response = await fetch(`${protocol}://${host}/api/quotations/${Number(id)}`, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });
  const payload = (await response.json()) as QuotationApi & { message?: string };
  if (!response.ok) {
    throw new Error(payload.message ?? "Unable to load quotation");
  }

  // Only DRAFT quotations can be edited; everything else is read-only.
  if (payload.status !== "DRAFT") {
    redirect(`/quotations/${payload.id}/view`);
  }

  return (
    <AppPageShell wide>
      <QuotationEditor
        title={`แก้ไขใบเสนอราคา ${payload.quotationNumber}`}
        submitLabel="บันทึกการแก้ไข"
        quotationId={payload.id}
        initialForm={mapQuotationToForm(payload)}
      />
    </AppPageShell>
  );
}
