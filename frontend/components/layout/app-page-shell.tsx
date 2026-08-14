import type { ReactNode } from "react";

const patternStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
} as const;

export const appControlClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400";

export const appBtnPrimaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900";

export const appBtnSuccessClass =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900";

export const appBtnSecondaryClass =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/60 hover:text-indigo-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-indigo-500/40 dark:hover:bg-indigo-950/40";

export const appBtnGhostClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500/30";

export const appCardClass =
  "rounded-2xl border border-zinc-200/90 bg-white/90 p-5 shadow-lg shadow-indigo-950/5 backdrop-blur-sm dark:border-zinc-700/90 dark:bg-zinc-900/80 dark:shadow-black/30";

type AppPageShellProps = {
  children: ReactNode;
  /** Use max-w-7xl for wide layouts (e.g. invoice editor). */
  wide?: boolean;
  /** Narrower column for read-only invoice view. */
  reading?: boolean;
};

export default function AppPageShell({ children, wide = false, reading = false }: AppPageShellProps) {
  const maxClass = wide ? "max-w-7xl" : reading ? "max-w-5xl" : "max-w-6xl";
  return (
    <div className="relative min-h-screen overflow-x-hidden text-zinc-900 dark:text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-br from-indigo-50/95 via-white to-emerald-50/40 dark:from-zinc-950 dark:via-indigo-950/25 dark:to-zinc-950"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-50 dark:opacity-30"
        style={patternStyle}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 top-20 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-600/10"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-32 h-56 w-56 rounded-full bg-emerald-300/15 blur-3xl dark:bg-emerald-700/10"
        aria-hidden
      />
      <main className={`relative z-10 mx-auto w-full ${maxClass} px-4 py-8 sm:px-6 lg:py-10`}>{children}</main>
    </div>
  );
}
