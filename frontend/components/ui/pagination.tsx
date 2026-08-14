import { IconChevronLeft, IconChevronRight } from "@/components/invoices/invoice-list-icons";

export interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],
}: PaginationProps) {
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (page > 3) {
        pageNumbers.push("...");
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pageNumbers.push(i);
      }

      if (page < totalPages - 2) {
        pageNumbers.push("...");
      }
      pageNumbers.push(totalPages);
    }
    return pageNumbers;
  };

  const pageInfo = `หน้า ${page} / ${totalPages} (ทั้งหมด ${totalItems} รายการ)`;
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-zinc-200/90 bg-white/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700/90 dark:bg-zinc-900/60">
      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
        <p>{pageInfo}</p>
        <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 hidden sm:block" />
        <div className="flex items-center gap-1.5">
          <span>แสดง</span>
          <select
            className="rounded-lg border border-zinc-200 bg-white px-2 py-0.5 text-xs text-zinc-800 shadow-xs focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-850 dark:text-zinc-200"
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>รายการต่อหน้า</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-xs transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-500/30"
          title="ก่อนหน้า"
        >
          <IconChevronLeft className="h-4 w-4" />
        </button>

        {getPageNumbers().map((num, index) => {
          if (num === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-8 w-8 items-center justify-center text-zinc-450 dark:text-zinc-500 select-none"
              >
                ...
              </span>
            );
          }

          const pageNum = num as number;
          const isCurrent = pageNum === page;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold shadow-xs transition ${
                isCurrent
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-500/30"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 shadow-xs transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-500/30"
          title="ถัดไป"
        >
          <IconChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
