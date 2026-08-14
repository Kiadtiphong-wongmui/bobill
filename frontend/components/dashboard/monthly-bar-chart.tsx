"use client";

import React, { useState, useRef } from "react";
import type { MonthlyStat } from "@/lib/invoices/types";
import { formatMoney } from "@/lib/format/money";

interface MonthlyBarChartProps {
  monthlyStats: MonthlyStat[];
  loading?: boolean;
  selectedYear?: number;
  availableYears?: number[];
  onYearChange?: (year: number) => void;
}

export default function MonthlyBarChart({
  monthlyStats,
  loading = false,
  selectedYear,
  availableYears,
  onYearChange,
}: MonthlyBarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTooltip, setActiveTooltip] = useState<{
    idx: number;
    type: "issued" | "draft" | "cancelled" | "total";
    x: number;
    y: number;
    val: number | string;
    label: string;
  } | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs min-h-85 animate-pulse">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/4 mb-8" />
        <div className="flex items-end justify-between gap-2 h-48 w-full mt-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-t-lg" style={{ height: `${15 + (i % 4) * 20}%` }} />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Calculate max count for scaling (minimum max value is 5 for nicer height with small numbers)
  const maxVal = Math.max(
    ...monthlyStats.map(
      (m) => m.issuedCount + m.draftCount + m.cancelledCount
    ),
    5
  );

  // Round maxVal up to the nearest multiple of 4 for clean, evenly-spaced Y-axis ticks
  const yMax = Math.ceil(maxVal / 4) * 4;
  // Generate 5 evenly-spaced ticks: yMax, 3/4, 2/4, 1/4, 0 — always integers
  const step = yMax / 4;
  const yTicks = [yMax, step * 3, step * 2, step * 1, 0];

  const totalInvoices = monthlyStats.reduce(
    (sum, m) => sum + m.issuedCount + m.draftCount + m.cancelledCount,
    0
  );

  const handleMouseMove = (
    e: React.MouseEvent,
    idx: number,
    type: "issued" | "draft" | "cancelled" | "total",
    val: number | string,
    label: string
  ) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Offset relative to chart canvas container
    const parentRect = containerRef.current?.getBoundingClientRect();
    if (!parentRect) return;

    setActiveTooltip({
      idx,
      type,
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top - 8,
      val,
      label,
    });
  };

  return (
    <div className="flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs min-h-85 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            จำนวนบิลที่ออกรายเดือน
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            <span>สถิติตลอดปี พ.ศ. {selectedYear ? selectedYear + 543 : "..."}</span>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              จำนวนบิลทั้งหมด: {totalInvoices} ใบ
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Year Selector Dropdown */}
          {availableYears && availableYears.length >= 1 && selectedYear && onYearChange && (
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="text-xs font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-250 dark:border-zinc-700 rounded-lg px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  ปี พ.ศ. {y + 543}
                </option>
              ))}
            </select>
          )}

          {/* Custom Legend */}
          <div className="flex items-center gap-3.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>ออกแล้ว</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>ร่าง</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              <span>ยกเลิก</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart Canvas - Allows horizontal scroll on very narrow screens */}
      <div
        ref={containerRef}
        className="relative flex-1 flex h-56 mt-4 select-none overflow-x-auto scrollbar-none"
      >
        {/* Y Axis Gridlines & Labels — pb-8 leaves room for X-axis label row */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] font-medium text-zinc-400 dark:text-zinc-500 pb-8">
          {yTicks.map((tick, i) => (
            <div key={i} className="flex items-center w-full">
              <span className="w-6 text-right pr-2 tabular-nums">{tick}</span>
              <div className="flex-1 border-t border-dashed border-zinc-100 dark:border-zinc-800/80" />
            </div>
          ))}
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex justify-between gap-1.5 sm:gap-3 pl-8 z-10 h-full min-w-120 sm:min-w-0">
          {monthlyStats.map((item, idx) => {
            const totalCount = item.issuedCount + item.draftCount + item.cancelledCount;
            const hasData = totalCount > 0;

            const totalHeight = hasData ? (totalCount / yMax) * 100 : 0;
            const issuedHeight = hasData ? (item.issuedCount / totalCount) * 100 : 0;
            const draftHeight = hasData ? (item.draftCount / totalCount) * 100 : 0;
            const cancelledHeight = hasData ? (item.cancelledCount / totalCount) * 100 : 0;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center group"
              >
                {/* Stacked Vertical Bar — Fixed height wrapper */}
                <div className="relative h-48 w-full flex items-end">
                  <div
                    className="w-full sm:w-6 md:w-8 mx-auto rounded-t-sm overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:shadow-md group-hover:scale-x-105 relative"
                    style={{ height: hasData ? `${totalHeight}%` : "2px" }}
                  >


                    {/* Cancelled (Bottom) */}
                    {cancelledHeight > 0 && (
                      <div
                        style={{ height: `${cancelledHeight}%`, minHeight: "3px" }}
                        className="relative z-10 w-full bg-rose-500 hover:bg-rose-400 transition-all duration-200 cursor-pointer"
                        onMouseMove={(e) =>
                          handleMouseMove(e, idx, "cancelled", item.cancelledCount, "ยกเลิก")
                        }
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                    )}

                    {/* Draft (Middle) */}
                    {draftHeight > 0 && (
                      <div
                        style={{ height: `${draftHeight}%`, minHeight: "3px" }}
                        className="relative z-10 w-full bg-amber-500 hover:bg-amber-400 transition-all duration-200 cursor-pointer"
                        onMouseMove={(e) =>
                          handleMouseMove(e, idx, "draft", item.draftCount, "ฉบับร่าง")
                        }
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                    )}

                    {/* Issued (Top) */}
                    {issuedHeight > 0 && (
                      <div
                        style={{ height: `${issuedHeight}%`, minHeight: "3px" }}
                        className="relative z-10 w-full bg-emerald-500 hover:bg-emerald-400 transition-all duration-200 cursor-pointer"
                        onMouseMove={(e) =>
                          handleMouseMove(e, idx, "issued", item.issuedCount, "ออกเอกสารแล้ว")
                        }
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                    )}

                    {/* Hover wrapper for total info */}
                    {hasData && (
                      <div
                        className="absolute inset-0 z-20 opacity-0 cursor-pointer"
                        onMouseMove={(e) =>
                          handleMouseMove(
                            e,
                            idx,
                            "total",
                            `${totalCount} ใบ`,
                            `${item.monthName} ${item.year + 543}`
                          )
                        }
                        onMouseLeave={() => setActiveTooltip(null)}
                      />
                    )}
                  </div>
                </div>

                {/* X Axis Label — fixed height row below bar, always visible */}
                <div className="h-8 flex items-center justify-center text-[10px] md:text-xs font-semibold text-zinc-500 dark:text-zinc-400 w-full text-center">
                  {item.monthName}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Tooltip */}
        {activeTooltip && (
          <div
            style={{
              left: `${activeTooltip.x}px`,
              top: `${activeTooltip.y}px`,
              transform: "translate(-50%, -100%)",
            }}
            className="absolute z-30 bg-zinc-950 dark:bg-zinc-800 text-white text-[10px] sm:text-xs px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none transition-all duration-150 flex flex-col gap-0.5 min-w-20"
          >
            <span className="font-bold text-zinc-300 dark:text-zinc-400 text-[9px] uppercase tracking-wider">
              {activeTooltip.label}
            </span>
            <span className="font-extrabold text-white">
              {activeTooltip.type === "total" ? (
                activeTooltip.val
              ) : (
                `${activeTooltip.val} ใบ`
              )}
            </span>
            {activeTooltip.type === "issued" && (
              <span className="text-[9px] font-semibold text-emerald-400 border-t border-zinc-800 dark:border-zinc-700 pt-0.5 mt-0.5">
                ยอดขาย: {formatMoney(monthlyStats[activeTooltip.idx]?.totalSales ?? 0)}
              </span>
            )}
            {/* Tooltip arrow */}
            <div className="w-1.5 h-1.5 bg-zinc-950 dark:bg-zinc-800 rotate-45 absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" />
          </div>
        )}
      </div>
    </div>
  );
}
