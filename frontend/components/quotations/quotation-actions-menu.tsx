"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { IconEllipsisVertical } from "@/components/invoices/invoice-list-icons";
import type { QuotationApi } from "@/lib/quotations/types";

const MENU_MIN_WIDTH_PX = 200;
const MENU_Z = 100;

const itemClass =
  "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-indigo-950/40";

export type QuotationActionHandlers = {
  onSend: (id: number) => void;
  onAccept: (id: number) => void;
  onReject: (id: number) => void;
  onConvert: (id: number) => void;
  onDelete: (id: number) => void;
};

type Props = QuotationActionHandlers & {
  quotation: QuotationApi;
};

export function QuotationActionsMenu({ quotation, onSend, onAccept, onReject, onConvert, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const b = buttonRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    setCoords({ top: r.bottom + 6, right: Math.max(8, window.innerWidth - r.right) });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      const clear = window.setTimeout(() => setCoords(null), 0);
      return () => window.clearTimeout(clear);
    }
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, reposition]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const n = e.target as Node | null;
      if (!n) return;
      if (buttonRef.current?.contains(n) || menuRef.current?.contains(n)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const { status } = quotation;
  const alreadyConverted = quotation.convertedInvoiceId !== null;

  const actions: Array<{ label: string; tone: string; disabled: boolean; run: (id: number) => void }> = [
    { label: "ส่งใบเสนอราคา", tone: "text-sky-800 dark:text-sky-300", disabled: status !== "DRAFT", run: onSend },
    { label: "ลูกค้าตอบรับ", tone: "text-emerald-800 dark:text-emerald-300", disabled: status !== "SENT", run: onAccept },
    { label: "ลูกค้าปฏิเสธ", tone: "text-red-800 dark:text-red-300", disabled: status !== "SENT", run: onReject },
    {
      label: alreadyConverted ? "แปลงเป็นใบแจ้งหนี้แล้ว" : "แปลงเป็นใบแจ้งหนี้",
      tone: "text-indigo-800 dark:text-indigo-300",
      disabled: status !== "ACCEPTED" || alreadyConverted,
      run: onConvert,
    },
    { label: "ลบฉบับร่าง", tone: "text-red-800 dark:text-red-300", disabled: status !== "DRAFT", run: onDelete },
  ];

  const menuPanel =
    open && coords ? (
      <div
        ref={menuRef}
        role="menu"
        style={{ position: "fixed", top: coords.top, right: coords.right, zIndex: MENU_Z, minWidth: MENU_MIN_WIDTH_PX }}
        className="overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl ring-1 ring-zinc-900/5 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-black/40"
      >
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            role="menuitem"
            disabled={action.disabled}
            className={`${itemClass} ${action.tone}`}
            onClick={() => {
              setOpen(false);
              action.run(quotation.id);
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    ) : null;

  return (
    <div className="relative flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`จัดการใบเสนอราคา ${quotation.quotationNumber}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-950/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-500/40"
      >
        <IconEllipsisVertical className="h-4 w-4" />
      </button>
      {typeof document !== "undefined" && menuPanel ? createPortal(menuPanel, document.body) : null}
    </div>
  );
}
