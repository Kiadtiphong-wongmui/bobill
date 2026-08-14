"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthAlertError } from "@/components/auth/auth-shell";
import AppPageShell, {
  appBtnPrimaryClass,
  appBtnSecondaryClass,
  appCardClass,
  appControlClass,
} from "@/components/layout/app-page-shell";
import { Pagination } from "@/components/ui/pagination";
import { listEmployeeCards, deleteEmployeeCard, getDisplayPhotoUrl } from "@/lib/employee-cards/api";
import type { EmployeeCard } from "@/lib/employee-cards/types";

export default function EmployeeCardsListPage() {
  const [items, setItems] = useState<EmployeeCard[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [prevParams, setPrevParams] = useState({ page, pageSize, q, refreshKey });
  if (
    page !== prevParams.page ||
    pageSize !== prevParams.pageSize ||
    q !== prevParams.q ||
    refreshKey !== prevParams.refreshKey
  ) {
    setPrevParams({ page, pageSize, q, refreshKey });
    setIsLoading(true);
    setErrorMessage(null);
  }

  useEffect(() => {
    let cancelled = false;

    const runFetch = async () => {
      try {
        const response = await listEmployeeCards({ page, pageSize, q });
        if (!cancelled) {
          setItems(response.items);
          setTotalPages(response.meta.totalPages);
          setTotal(response.meta.total);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลบัตรพนักงานได้");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void runFetch();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, q, refreshKey]);

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`ยืนยันการลบบัตรพนักงานของ "${name}"?`)) return;
    try {
      await deleteEmployeeCard(id);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลบัตรพนักงานได้");
    }
  };

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQ(searchText);
  };

  const clearSearch = () => {
    setSearchText("");
    setPage(1);
    setQ("");
  };

  return (
    <AppPageShell>
      <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">รายการบัตรพนักงาน</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            สร้าง จัดการ และพิมพ์บัตรพนักงาน ทั้งด้านหน้าและด้านหลัง
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/employee-cards/new" className={appBtnPrimaryClass}>
            {/* Plus icon */}
            <svg className="mr-1.5 h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            สร้างบัตรพนักงานใหม่
          </Link>
        </div>
      </header>

      {errorMessage && (
        <div className="mt-6">
          <AuthAlertError message={errorMessage} />
        </div>
      )}

      {/* Search Bar */}
      <div className={`${appCardClass} mt-6`}>
        <form onSubmit={applySearch} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="ค้นหาตาม ชื่อ-นามสกุล, เลขที่ใบอนุญาตทำงาน หรือนายจ้าง..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className={appControlClass}
            />
            {searchText && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button type="submit" className={appBtnSecondaryClass}>
            <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            ค้นหา
          </button>
        </form>
      </div>

      {/* Main List */}
      <div className={`${appCardClass} mt-6 overflow-hidden p-0`}>
        {isLoading ? (
          // Loading Skeleton
          <div className="space-y-4 p-6">
            <div className="h-6 w-1/4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.333 0 4 .667 4 2V15H5v-1c0-1.333 2.667-2 4-2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">ไม่พบข้อมูล</h3>
            <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">ยังไม่มีข้อมูลบัตรพนักงานในระบบ หรือคำค้นหาไม่ตรงกับรายการใดๆ</p>
            <div className="mt-6">
              <Link href="/employee-cards/new" className={appBtnPrimaryClass}>
                สร้างบัตรพนักงานใบแรก
              </Link>
            </div>
          </div>
        ) : (
          // Table Layout
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 font-semibold">รูปภาพ</th>
                  <th className="px-6 py-4 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-4 font-semibold">ข้อมูลพนักงาน</th>
                  <th className="px-6 py-4 font-semibold">นายจ้าง / สถานประกอบการ</th>
                  <th className="px-6 py-4 font-semibold">หมดอายุ</th>
                  <th className="px-6 py-4 font-semibold text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {items.map((card) => (
                  <tr
                    key={card.id}
                    className="group border-b border-zinc-100 hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-900/20"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      {card.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getDisplayPhotoUrl(card.photoUrl)}
                          alt={card.name}
                          className="h-10 w-10 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{card.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs gap-0.5">
                        <span>
                          <span className="font-medium text-zinc-500">สัญชาติ:</span> {card.nationality}
                        </span>
                        <span>
                          <span className="font-medium text-zinc-500">ใบอนุญาต:</span> {card.workPermitNo}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-800 dark:text-zinc-200">{card.employerName}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs">
                        {new Date(card.expiryDate).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`/api/employee-cards/${card.id}/export-pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-indigo-600 shadow-xs transition hover:border-indigo-200 hover:bg-indigo-50/50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                          title="ดาวน์โหลด PDF / พิมพ์"
                        >
                          <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </a>
                        <Link
                          href={`/employee-cards/${card.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 shadow-xs transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                          title="แก้ไข"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(card.id, card.name)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-rose-600 shadow-xs transition hover:border-rose-300 hover:bg-rose-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-rose-400 dark:hover:bg-rose-950/40"
                          title="ลบ"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && items.length > 0 && (
        <div className="mt-6">
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={total}
            totalPages={totalPages}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </AppPageShell>
  );
}
