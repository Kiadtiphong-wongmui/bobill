import Link from "next/link";
import type { ReactNode } from "react";

export function AuthAlertError({ message }: { message: string }) {
  return (
    <div
      className="flex gap-3 rounded-xl border border-red-200 bg-red-50/90 px-3 py-2.5 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
      role="alert"
    >
      <span className="mt-0.5 shrink-0 text-red-500" aria-hidden>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span>{message}</span>
    </div>
  );
}

export function AuthAlertSuccess({ message }: { message: string }) {
  return (
    <div
      className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2.5 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/35 dark:text-emerald-200"
      role="status"
    >
      <span className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span>{message}</span>
    </div>
  );
}

export const authLabelClass =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export const authInputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm transition placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-400/20";

export const authPrimaryButtonClass =
  "w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-zinc-900";

export const authSecondaryLinkClass =
  "font-semibold text-indigo-600 underline decoration-indigo-600/30 underline-offset-2 transition hover:text-indigo-500 hover:decoration-indigo-500 dark:text-indigo-400 dark:decoration-indigo-400/30 dark:hover:text-indigo-300";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export default function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-br from-indigo-50 via-white to-emerald-50/80 text-zinc-900 dark:from-zinc-950 dark:via-indigo-950/40 dark:to-zinc-950 dark:text-zinc-100">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-600/10"
        aria-hidden
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 self-center rounded-xl border border-zinc-200/80 bg-white/70 px-3 py-2 text-sm font-semibold text-zinc-800 shadow-sm backdrop-blur-sm transition hover:border-indigo-200 hover:bg-white hover:text-indigo-700 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:border-indigo-500/40 dark:hover:bg-zinc-900"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-inner shadow-indigo-950/20 transition group-hover:bg-indigo-500">
            B
          </span>
          Bobill
        </Link>

        <div className="rounded-3xl border border-zinc-200/80 bg-white/90 p-8 shadow-xl shadow-indigo-950/5 backdrop-blur-md dark:border-zinc-700/80 dark:bg-zinc-900/85 dark:shadow-black/40">
          <div className="border-b border-zinc-100 pb-6 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              ระบบออกใบเสร็จ
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
          </div>
          <div className="pt-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
