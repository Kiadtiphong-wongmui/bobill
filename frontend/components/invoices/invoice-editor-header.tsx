import Link from "next/link";

import { appBtnPrimaryClass } from "@/components/layout/app-page-shell";

const headerNavBackClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2";
const headerNavHomeClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2";

export type InvoiceEditorHeaderProps = {
  title: string;
  enableSaveDefaults: boolean;
  onSaveDefaultsAll: () => void;
};

export function InvoiceEditorHeader({ title, enableSaveDefaults, onSaveDefaultsAll }: InvoiceEditorHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          กรอกฟอร์มด้านซ้าย และตรวจตัวอย่างเอกสารด้านขวาแบบเรียลไทม์
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2 shrink-0">
        {enableSaveDefaults ? (
          <button type="button" className={appBtnPrimaryClass} onClick={onSaveDefaultsAll}>
            <svg
              className="h-4 w-4 shrink-0 opacity-90"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M15.988 3.012A2.25 2.25 0 0118 5.25v6.548A2.25 2.25 0 0115.75 14H13.5v-3.379a3 3 0 00-.879-2.121l-2.122-2.12m0 0a3 3 0 00-4.243 0L4.754 8.757A3 3 0 003.5 9.879V18a2 2 0 002 2h9a2 2 0 002-2v-7.121a3 3 0 00-.879-2.122l-2.122-2.121z"
                clipRule="evenodd"
              />
            </svg>
            บันทึกค่าเริ่มต้นทุกส่วน
          </button>
        ) : null}
        {enableSaveDefaults ? <div className="hidden h-8 w-px shrink-0 bg-zinc-200 dark:bg-zinc-700 sm:block" aria-hidden /> : null}
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/invoices" className={headerNavBackClass}>
            <svg
              className="h-4 w-4 shrink-0 text-zinc-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
            </svg>
            กลับรายการใบเสร็จ
          </Link>
          <Link href="/" className={headerNavHomeClass}>
            <svg
              className="h-4 w-4 shrink-0 text-zinc-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            หน้าแรก
          </Link>
        </div>
      </div>
    </header>
  );
}
