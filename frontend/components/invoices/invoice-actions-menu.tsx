"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import type { InvoiceApi } from "@/lib/invoices/types";

import {
  IconEllipsisVertical,
} from "@/components/invoices/invoice-list-icons";

function menuItemClass() {
  return "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-zinc-800 transition hover:bg-indigo-50 dark:text-zinc-100 dark:hover:bg-indigo-950/40";
}

const MENU_MIN_WIDTH_PX = 180;
const MENU_Z = 100;

type InvoiceActionsMenuProps = {
  invoice: InvoiceApi;
  onIssue: (id: number) => void;
  onCancel: (id: number) => void;
};

export function InvoiceActionsMenu({ invoice, onIssue, onCancel }: InvoiceActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const reposition = useCallback(() => {
    const b = buttonRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const right = Math.max(8, window.innerWidth - r.right);
    const top = r.bottom + 6;
    setCoords({ top, right });
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

  const menuPanel =
    open && coords ? (
      <div
        ref={menuRef}
        role="menu"
        style={{
          position: "fixed",
          top: coords.top,
          right: coords.right,
          zIndex: MENU_Z,
          minWidth: MENU_MIN_WIDTH_PX,
        }}
        className="overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl ring-1 ring-zinc-900/5 dark:border-zinc-600 dark:bg-zinc-900 dark:ring-black/40"
      >
        <button
          type="button"
          role="menuitem"
          disabled={invoice.status !== "DRAFT"}
          className={`${menuItemClass()} disabled:cursor-not-allowed disabled:opacity-40 text-emerald-800 dark:text-emerald-300`}
          onClick={() => {
            setOpen(false);
            onIssue(invoice.id);
          }}
        >
          ออกเอกสาร
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={invoice.status === "CANCELLED"}
          className={`${menuItemClass()} disabled:cursor-not-allowed disabled:opacity-40 text-red-800 dark:text-red-300`}
          onClick={() => {
            setOpen(false);
            onCancel(invoice.id);
          }}
        >
          ยกเลิกใบเสร็จ
        </button>
      </div>
    ) : null;

  return (
    <div className="relative flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`จัดการใบเสร็จ ${invoice.invoiceNumber}`}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-950/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-500/40"
      >
        <IconEllipsisVertical className="h-4 w-4" />
      </button>
      {typeof document !== "undefined" && menuPanel ? createPortal(menuPanel, document.body) : null}
    </div>
  );
}
