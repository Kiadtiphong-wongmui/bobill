"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type MeResponse = {
  id: number;
  username: string;
  roles: string[];
};

const HIDE_ON_PATHS = ["/login", "/signup"];

function SidebarContent({
  user,
  meLoading,
  handleLogout,
  onClose,
}: {
  user: MeResponse | null;
  meLoading: boolean;
  handleLogout: () => Promise<void>;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const isInvoiceList = pathname === "/invoices";
  const isQuotationList = pathname.startsWith("/quotations");
  const isDashboard = pathname === "/";
  const isEmployeeCardList = pathname.startsWith("/employee-cards");
  const isBackup = pathname.startsWith("/backup");

  const isAdmin = user?.roles.includes("ADMIN") ?? false;

  const linkClass = (active: boolean) => [
    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
    active
      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/10"
      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/40 dark:hover:text-zinc-200",
  ].join(" ");

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Brand Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25">
            B
          </span>
          Bobill
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* User Section (Positioned below Brand Header and above Navigation) */}
      <div className="border-t border-b border-zinc-200/90 py-4 dark:border-zinc-800/90">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col px-1">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">เข้าใช้งานโดย</span>
            <span className="truncate text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {meLoading ? "กำลังตรวจสอบผู้ใช้…" : user?.username ?? "บุคคลทั่วไป"}
            </span>
          </div>
          {user && (
            <button
              type="button"
              onClick={() => {
                void handleLogout();
                onClose?.();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-semibold text-zinc-700 shadow-xs transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80"
            >
              {/* Logout icon */}
              <svg className="h-4.5 w-4.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              ออกจากระบบ
            </button>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1.5" aria-label="เมนูหลัก">
        <Link href="/" onClick={onClose} className={linkClass(isDashboard)}>
          {/* Grid icon */}
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
          </svg>
          หน้าหลัก
        </Link>
        <Link href="/quotations" onClick={onClose} className={linkClass(isQuotationList)}>
          {/* Clipboard icon */}
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          ใบเสนอราคา
        </Link>
        <Link href="/invoices" onClick={onClose} className={linkClass(isInvoiceList)}>
          {/* Document list icon */}
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          ใบแจ้งหนี้
        </Link>
        <Link href="/employee-cards" onClick={onClose} className={linkClass(isEmployeeCardList)}>
          {/* Badge/ID icon */}
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.333 0 4 .667 4 2V15H5v-1c0-1.333 2.667-2 4-2z" />
          </svg>
          บัตรพนักงาน
        </Link>
        {isAdmin && (
          <Link href="/backup" onClick={onClose} className={linkClass(isBackup)}>
            {/* Database / Backup icon */}
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Backup
          </Link>
        )}
      </nav>
    </div>
  );
}

export default function MainSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<MeResponse | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
    if (HIDE_ON_PATHS.includes(pathname)) {
      setUser(null);
      setMeLoading(false);
    } else {
      setMeLoading(true);
    }
  }

  useEffect(() => {
    if (HIDE_ON_PATHS.includes(pathname)) {
      return;
    }

    let cancelled = false;

    const loadMe = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setUser(null);
          return;
        }
        const payload = (await response.json()) as MeResponse;
        if (!cancelled) setUser(payload);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    };

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (HIDE_ON_PATHS.includes(pathname)) {
    return null;
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b border-zinc-200/90 bg-white/95 px-4 shadow-xs backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden">
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-md shadow-indigo-600/25">
            B
          </span>
          Bobill
        </Link>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 focus:outline-none"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Mobile Sidebar Overlay/Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-xs md:hidden" onClick={() => setIsOpen(false)}>
          <aside
            className="fixed bottom-0 left-0 top-0 flex w-64 flex-col border-r border-zinc-200/90 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent user={user} meLoading={meLoading} handleLogout={handleLogout} onClose={() => setIsOpen(false)} />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (persistent) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200/90 bg-white/80 p-5 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 md:flex">
        <SidebarContent user={user} meLoading={meLoading} handleLogout={handleLogout} />
      </aside>
    </>
  );
}
