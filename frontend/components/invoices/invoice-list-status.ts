import type { InvoiceApi } from "@/lib/invoices/types";

export function invoiceStatusBadgeClass(invoice: InvoiceApi): string {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1";
  if (invoice.status === "ISSUED") return `${base} bg-emerald-100 text-emerald-800 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-300`;
  if (invoice.status === "CANCELLED") return `${base} bg-red-100 text-red-800 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300`;
  return `${base} bg-zinc-100 text-zinc-700 ring-zinc-400/20 dark:bg-zinc-800 dark:text-zinc-300`;
}

export function invoiceStatusLabel(status: InvoiceApi["status"]): string {
  if (status === "DRAFT") return "ฉบับร่าง";
  if (status === "ISSUED") return "ออกเอกสารแล้ว";
  return "ยกเลิก";
}
