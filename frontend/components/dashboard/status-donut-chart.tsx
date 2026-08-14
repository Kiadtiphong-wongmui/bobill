"use client";

import React, { useState } from "react";

interface StatusDonutChartProps {
  issuedCount: number;
  draftCount: number;
  cancelledCount: number;
  loading?: boolean;
}

export default function StatusDonutChart({
  issuedCount,
  draftCount,
  cancelledCount,
  loading = false,
}: StatusDonutChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = issuedCount + draftCount + cancelledCount;

  // SVG parameters
  const radius = 60;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~376.99

  // Calculate percentages
  const issuedPct = total > 0 ? (issuedCount / total) * 100 : 0;
  const draftPct = total > 0 ? (draftCount / total) * 100 : 0;
  const cancelledPct = total > 0 ? (cancelledCount / total) * 100 : 0;

  // Segment stroke dash lengths
  const issuedDash = (issuedPct / 100) * circumference;
  const draftDash = (draftPct / 100) * circumference;
  const cancelledDash = (cancelledPct / 100) * circumference;

  // Stacking offset calculations
  const segments = [
    {
      name: "ออกเอกสารแล้ว",
      actualCount: issuedCount,
      percentage: issuedPct,
      dash: issuedDash,
      offset: 0,
      colorClass: "text-emerald-500 dark:text-emerald-400",
      strokeColor: "#10b981", // Tailwind emerald-500
      strokeColorHover: "#34d399", // Tailwind emerald-400
      bgClass: "bg-emerald-500",
    },
    {
      name: "ฉบับร่าง",
      actualCount: draftCount,
      percentage: draftPct,
      dash: draftDash,
      offset: -issuedDash,
      colorClass: "text-amber-500 dark:text-amber-400",
      strokeColor: "#f59e0b", // Tailwind amber-500
      strokeColorHover: "#fbbf24", // Tailwind amber-400
      bgClass: "bg-amber-500",
    },
    {
      name: "ยกเลิก",
      actualCount: cancelledCount,
      percentage: cancelledPct,
      dash: cancelledDash,
      offset: -(issuedDash + draftDash),
      colorClass: "text-rose-500 dark:text-rose-400",
      strokeColor: "#f43f5e", // Tailwind rose-500
      strokeColorHover: "#fb7185", // Tailwind rose-400
      bgClass: "bg-rose-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs animate-pulse h-full min-h-64">
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-12 border-zinc-200/80 dark:border-zinc-800" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs h-full">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 self-start mb-4">
        สัดส่วนสถานะบิล
      </h3>

      {total === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 w-full">
          <svg className="w-36 h-36 text-zinc-200 dark:text-zinc-800" viewBox="0 0 150 150">
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
            />
          </svg>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 font-medium">ไม่พบข้อมูลใบเสร็จ</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center w-full my-auto py-2">
          <div className="relative flex items-center justify-center w-36 h-36">
            <svg
              className="w-full h-full transform -rotate-90 select-none"
              viewBox="0 0 150 150"
            >
              {segments.map((seg, idx) => {
                if (seg.actualCount === 0) return null;
                const isHovered = hoveredIndex === idx;
                return (
                  <circle
                    key={idx}
                    cx="75"
                    cy="75"
                    r={radius}
                    fill="transparent"
                    stroke={isHovered ? seg.strokeColorHover : seg.strokeColor}
                    strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                    strokeDasharray={`${seg.dash} ${circumference}`}
                    strokeDashoffset={seg.offset}
                    strokeLinecap="round"
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                );
              })}
            </svg>

            {/* Centermost Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              {hoveredIndex !== null ? (
                <>
                  <span className="text-2xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight">
                    {segments[hoveredIndex]?.actualCount}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${segments[hoveredIndex]?.colorClass}`}>
                    {segments[hoveredIndex]?.name}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {total}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    ใบเสร็จทั้งหมด
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
