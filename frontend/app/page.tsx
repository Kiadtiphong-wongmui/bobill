"use client";

import { useState } from "react";
import AppPageShell, {
  appCardClass,
} from "@/components/layout/app-page-shell";
import { useDashboardStats } from "@/components/dashboard/use-dashboard-stats";
import StatusDonutChart from "@/components/dashboard/status-donut-chart";
import MonthlyBarChart from "@/components/dashboard/monthly-bar-chart";





function IconDocument({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V12.75a9 9 0 00-9-9z" />
    </svg>
  );
}

function IconClipboard({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  );
}



function IconDocumentX({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V12.75a9 9 0 00-9-9z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5" />
    </svg>
  );
}



export default function Home() {
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);
  const { stats, loading, error } = useDashboardStats(selectedYear);

  return (
    <AppPageShell>
      <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">แดชบอร์ด</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            ภาพรวมการออกใบเสร็จและสถานะเอกสารของระบบทั้งหมด
          </p>
        </div>
      </header>

      {/* Visualizations Section */}
      <section className="mt-6">
        {/* Monthly Bar Chart */}
        <MonthlyBarChart
          loading={loading}
          monthlyStats={stats?.monthlyStats ?? []}
          selectedYear={stats?.selectedYear}
          availableYears={stats?.availableYears}
          onYearChange={setSelectedYear}
        />
      </section>

      {/* KPI Stats Section */}
      <section className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {/* Card 1: สัดส่วนสถานะบิล (Donut Chart) */}
        <StatusDonutChart
          loading={loading}
          issuedCount={stats?.issuedCount ?? 0}
          draftCount={stats?.draftCount ?? 0}
          cancelledCount={stats?.cancelledCount ?? 0}
        />

        {/* Card 2: ใบเสร็จที่ออกแล้ว */}
        <div className={`${appCardClass} flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300/50 dark:hover:border-emerald-500/30 group relative overflow-hidden h-full`}>
          <div className="absolute inset-0 bg-linear-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
            <IconDocument />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">ใบเสร็จออกแล้ว</p>
            {loading ? (
              <div className="mt-1.5 h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            ) : error ? (
              <p className="mt-1.5 text-sm font-semibold text-red-500">ข้อผิดพลาดในการโหลด</p>
            ) : (
              <p className="mt-1.5 text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight tabular-nums">
                {stats?.issuedCount ?? 0} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">ใบ</span>
              </p>
            )}
          </div>
          <p className="mt-auto pt-4 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80">
            จำนวนเอกสารใบเสร็จที่อนุมัติออกเรียบร้อยแล้ว
          </p>
        </div>

        {/* Card 3: ใบเสร็จฉบับร่าง */}
        <div className={`${appCardClass} flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-amber-300/50 dark:hover:border-amber-500/30 group relative overflow-hidden h-full`}>
          <div className="absolute inset-0 bg-linear-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            <IconClipboard />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">ใบเสร็จฉบับร่าง</p>
            {loading ? (
              <div className="mt-1.5 h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            ) : error ? (
              <p className="mt-1.5 text-sm font-semibold text-red-500">ข้อผิดพลาดในการโหลด</p>
            ) : (
              <p className="mt-1.5 text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight tabular-nums">
                {stats?.draftCount ?? 0} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">ใบ</span>
              </p>
            )}
          </div>
          <p className="mt-auto pt-4 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80">
            จำนวนใบเสร็จอยู่ระหว่างแก้ไขหรือยังไม่ออกเอกสาร
          </p>
        </div>

        {/* Card 4: ใบเสร็จยกเลิก */}
        <div className={`${appCardClass} flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-rose-300/50 dark:hover:border-rose-500/30 group relative overflow-hidden h-full`}>
          <div className="absolute inset-0 bg-linear-to-r from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
            <IconDocumentX />
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">ใบเสร็จยกเลิก</p>
            {loading ? (
              <div className="mt-1.5 h-8 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
            ) : error ? (
              <p className="mt-1.5 text-sm font-semibold text-red-500">ข้อผิดพลาดในการโหลด</p>
            ) : (
              <p className="mt-1.5 text-2xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight tabular-nums">
                {stats?.cancelledCount ?? 0} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">ใบ</span>
              </p>
            )}
          </div>
          <p className="mt-auto pt-4 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800/80">
            จำนวนเอกสารใบเสร็จที่ถูกกดยกเลิกในระบบ
          </p>
        </div>
      </section>
    </AppPageShell>
  );
}
