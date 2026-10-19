import type { QuotationStatus } from "@/lib/quotations/types";

const BADGE_BASE = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1";

const BADGE_TONES: Record<QuotationStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 ring-zinc-400/20 dark:bg-zinc-800 dark:text-zinc-300",
  SENT: "bg-sky-100 text-sky-800 ring-sky-600/15 dark:bg-sky-950/50 dark:text-sky-300",
  ACCEPTED: "bg-emerald-100 text-emerald-800 ring-emerald-600/15 dark:bg-emerald-950/50 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 ring-red-600/15 dark:bg-red-950/40 dark:text-red-300",
  EXPIRED: "bg-amber-100 text-amber-800 ring-amber-600/15 dark:bg-amber-950/40 dark:text-amber-300",
};

const LABELS: Record<QuotationStatus, string> = {
  DRAFT: "ฉบับร่าง",
  SENT: "ส่งแล้ว",
  ACCEPTED: "ลูกค้าตอบรับ",
  REJECTED: "ลูกค้าปฏิเสธ",
  EXPIRED: "หมดอายุ",
};

export const QUOTATION_STATUS_TABS: ReadonlyArray<{ value: QuotationStatus | "ALL"; label: string }> = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "DRAFT", label: LABELS.DRAFT },
  { value: "SENT", label: LABELS.SENT },
  { value: "ACCEPTED", label: LABELS.ACCEPTED },
  { value: "REJECTED", label: LABELS.REJECTED },
  { value: "EXPIRED", label: LABELS.EXPIRED },
];

export const quotationStatusBadgeClass = (status: QuotationStatus): string => `${BADGE_BASE} ${BADGE_TONES[status]}`;

export const quotationStatusLabel = (status: QuotationStatus): string => LABELS[status];
