"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  cleanData,
  createSnapshot,
  deleteSnapshot,
  getBackupStats,
  getSnapshotDownloadUrl,
  listSnapshots,
  restoreFromSnapshot,
} from "@/lib/backup/api";
import type { BackupStats, CleanTarget, SnapshotInfo } from "@/lib/backup/types";
import {
  appBtnPrimaryClass,
  appBtnSecondaryClass,
  appCardClass,
} from "@/components/layout/app-page-shell";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLEAN_TARGETS: { key: CleanTarget; label: string; description: string }[] = [
  { key: "invoices", label: "ใบเสร็จ / ใบแจ้งหนี้", description: "Invoice และรายการสินค้าทั้งหมด" },
  { key: "employee_cards", label: "บัตรพนักงาน", description: "ข้อมูลบัตรพนักงานทั้งหมด" },
  { key: "users", label: "บัญชีผู้ใช้", description: "ผู้ใช้ทั้งหมด (ยกเว้นบัญชีปัจจุบัน)" },
  { key: "upload_files", label: "ไฟล์ที่อัปโหลด", description: "รูปภาพลายเซ็นและรูปพนักงาน" },
];

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function SectionHeader({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 mb-6">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{title}</h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </div>
  );
}

function AlertBox({ type, message }: { type: "success" | "error" | "warning"; message: string }) {
  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800/50 dark:text-emerald-300",
    error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-300",
    warning: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/50 dark:text-amber-300",
  };
  const icons = { success: "✓", error: "✕", warning: "⚠" };
  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${styles[type]}`} role="alert">
      <span className="text-base font-bold shrink-0">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { date, time };
}

// ---------------------------------------------------------------------------
// Confirmation Modal
// ---------------------------------------------------------------------------

type ConfirmModalProps = {
  title: string;
  description: string;
  warningText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
};

function ConfirmModal({ title, description, warningText, onConfirm, onCancel, isLoading }: ConfirmModalProps) {
  const [checked, setChecked] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const canConfirm = checked && inputValue === "DELETE" && !isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm p-4" role="dialog" aria-modal>
      <div className={`${appCardClass} w-full max-w-md`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/40">
            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{title}</h3>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{description}</p>

        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5 dark:bg-red-950/30 dark:border-red-800/50">
          <p className="text-sm text-red-700 dark:text-red-300 font-medium">{warningText}</p>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              id="confirm-checkbox"
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 shrink-0"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              ฉันเข้าใจว่าการดำเนินการนี้<span className="font-semibold text-red-600 dark:text-red-400">ไม่สามารถย้อนกลับได้</span>
            </span>
          </label>

          <div>
            <label htmlFor="confirm-delete-input" className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              พิมพ์ <span className="font-mono font-bold text-red-600 dark:text-red-400 select-all">DELETE</span> เพื่อยืนยัน
            </label>
            <input
              id="confirm-delete-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="DELETE"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/15 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className={`flex-1 ${appBtnSecondaryClass}`}
            >
              ยกเลิก
            </button>
            <button
              type="button"
              id="confirm-danger-btn"
              onClick={onConfirm}
              disabled={!canConfirm}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/20 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus:ring-offset-zinc-900"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                  </svg>
                  กำลังดำเนินการ…
                </>
              ) : "ยืนยัน"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Snapshot Table Row
// ---------------------------------------------------------------------------

function SnapshotRow({
  snapshot,
  onRestore,
  onDelete,
}: {
  snapshot: SnapshotInfo;
  onRestore: (snap: SnapshotInfo) => void;
  onDelete: (snap: SnapshotInfo) => void;
}) {
  const { date, time } = formatDateTime(snapshot.createdAt);

  return (
    <tr className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center rounded-lg bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-bold uppercase tracking-wide dark:bg-amber-950/50 dark:text-amber-300">
            {snapshot.type}
          </span>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-mono">{snapshot.label}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">{date}</td>
      <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500 font-mono">{time}</td>
      <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-500">{formatBytes(snapshot.sizeBytes)}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <a
            href={getSnapshotDownloadUrl(snapshot.filename)}
            download={snapshot.filename}
            id={`download-${snapshot.filename}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-indigo-500/30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ดาวน์โหลด
          </a>
          <button
            type="button"
            id={`restore-sql-${snapshot.filename}`}
            onClick={() => onRestore(snapshot)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-amber-700 transition hover:border-amber-200 hover:bg-amber-50/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-amber-300 dark:hover:border-amber-500/30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Restore
          </button>
          <button
            type="button"
            id={`delete-snap-${snapshot.filename}`}
            onClick={() => onDelete(snapshot)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50/50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-red-400 dark:hover:border-red-500/30"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            ลบ
          </button>
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BackupClient() {
  const [snapshots, setSnapshots] = useState<SnapshotInfo[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupAlert, setBackupAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [selectedTargets, setSelectedTargets] = useState<Set<CleanTarget>>(new Set());
  const [cleanAlert, setCleanAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Confirmation modal state
  const [confirmState, setConfirmState] = useState<{
    action: "restore" | "delete" | "clean";
    snapshot?: SnapshotInfo;
    isLoading: boolean;
  } | null>(null);

  // Prevent duplicate requests
  const requestInFlight = useRef(false);

  const fetchSnapshots = useCallback(async () => {
    setLoadingSnapshots(true);
    try {
      const data = await listSnapshots();
      setSnapshots(data);
    } catch {
      setSnapshots([]);
    } finally {
      setLoadingSnapshots(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await getBackupStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      await fetchSnapshots();
      await fetchStats();
    }
    void init();
    // fetchSnapshots and fetchStats are stable useCallback references
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Backup Now ---
  const handleBackupNow = async () => {
    if (requestInFlight.current || backupLoading) return;
    requestInFlight.current = true;
    setBackupLoading(true);
    setBackupAlert(null);
    try {
      const result = await createSnapshot();
      setBackupAlert({ type: "success", message: `สำรองข้อมูลสำเร็จ — SQL Dump สำเร็จ (${formatBytes(result.sizeBytes)})` });
      await fetchSnapshots();
    } catch (err) {
      setBackupAlert({ type: "error", message: err instanceof Error ? err.message : "ไม่สามารถสำรองข้อมูลได้" });
    } finally {
      setBackupLoading(false);
      requestInFlight.current = false;
    }
  };

  // --- Delete snapshot ---
  const handleDeleteRequest = (snap: SnapshotInfo) => {
    setConfirmState({ action: "delete", snapshot: snap, isLoading: false });
  };

  const handleDeleteConfirm = async () => {
    if (!confirmState?.snapshot || requestInFlight.current) return;
    requestInFlight.current = true;
    setConfirmState((s) => s ? { ...s, isLoading: true } : null);
    try {
      await deleteSnapshot(confirmState.snapshot.filename);
      setSnapshots((prev) => prev.filter((s) => s.filename !== confirmState.snapshot?.filename));
      setBackupAlert({ type: "success", message: `ลบ ${confirmState.snapshot.filename} สำเร็จ` });
    } catch (err) {
      setBackupAlert({ type: "error", message: err instanceof Error ? err.message : "ไม่สามารถลบ Backup ได้" });
    } finally {
      setConfirmState(null);
      requestInFlight.current = false;
    }
  };

  // --- Restore ---
  const handleRestoreRequest = (snap: SnapshotInfo) => {
    setConfirmState({ action: "restore", snapshot: snap, isLoading: false });
  };

  const handleRestoreConfirm = async () => {
    if (!confirmState?.snapshot || requestInFlight.current) return;
    requestInFlight.current = true;
    setConfirmState((s) => s ? { ...s, isLoading: true } : null);
    try {
      const result = await restoreFromSnapshot(confirmState.snapshot.filename);
      setBackupAlert({ type: "success", message: result.message });
      await fetchSnapshots();
      await fetchStats();
    } catch (err) {
      setBackupAlert({ type: "error", message: err instanceof Error ? err.message : "ไม่สามารถกู้คืนข้อมูลได้" });
    } finally {
      setConfirmState(null);
      requestInFlight.current = false;
    }
  };

  // --- Clean Data ---
  const handleCleanRequest = () => {
    if (selectedTargets.size === 0) {
      setCleanAlert({ type: "error", message: "กรุณาเลือกหมวดหมู่ข้อมูลที่ต้องการลบอย่างน้อย 1 รายการ" });
      return;
    }
    setConfirmState({ action: "clean", isLoading: false });
  };

  const handleCleanConfirm = async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setConfirmState((s) => s ? { ...s, isLoading: true } : null);
    setCleanAlert(null);
    try {
      const result = await cleanData(Array.from(selectedTargets));
      const summary = Object.entries(result.results)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => {
          const label = CLEAN_TARGETS.find((t) => t.key === key)?.label ?? key;
          return `${label}: ${count} รายการ`;
        })
        .join(", ");
      setCleanAlert({ type: "success", message: `ลบข้อมูลสำเร็จ${summary ? ` — ${summary}` : ""}` });
      setSelectedTargets(new Set());
      await fetchStats();
    } catch (err) {
      setCleanAlert({ type: "error", message: err instanceof Error ? err.message : "ไม่สามารถลบข้อมูลได้" });
    } finally {
      setConfirmState(null);
      requestInFlight.current = false;
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmState) return;
    if (confirmState.action === "delete") await handleDeleteConfirm();
    else if (confirmState.action === "restore") await handleRestoreConfirm();
    else await handleCleanConfirm();
  };

  // Confirmation modal props
  const confirmModalProps = (() => {
    if (!confirmState) return null;
    if (confirmState.action === "delete") {
      return {
        title: "ยืนยันการลบ Backup",
        description: `คุณกำลังจะลบไฟล์ backup "${confirmState.snapshot?.filename ?? ""}" ออกจากระบบ`,
        warningText: "ไฟล์ backup จะถูกลบถาวรและไม่สามารถกู้คืนได้",
      };
    }
    if (confirmState.action === "restore") {
      return {
        title: "ยืนยันการกู้คืนข้อมูล",
        description: `คุณกำลังจะกู้คืนข้อมูลจาก "${confirmState.snapshot?.label ?? ""}" (SQL DUMP)`,
        warningText: "ข้อมูลทั้งหมดในระบบจะถูกแทนที่ด้วยข้อมูลจาก Backup นี้ และไม่สามารถย้อนกลับได้",
      };
    }
    const targetLabels = Array.from(selectedTargets)
      .map((t) => CLEAN_TARGETS.find((c) => c.key === t)?.label ?? t)
      .join(", ");
    return {
      title: "ยืนยันการลบข้อมูล",
      description: `คุณกำลังจะลบ: ${targetLabels}`,
      warningText: "ข้อมูลจะถูกลบถาวรจากฐานข้อมูลและไม่สามารถกู้คืนได้ กรุณาสำรองข้อมูลก่อนดำเนินการ",
    };
  })();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Backup & Restore</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          จัดการการสำรองข้อมูล กู้คืนข้อมูล และล้างข้อมูลระบบ — เฉพาะ Admin เท่านั้น
        </p>
      </div>

      {/* ================================================================
          SECTION 1 — BACKUP
      ================================================================ */}
      <div className={appCardClass} id="backup-section">
        <SectionHeader
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          }
          title="Backup"
          description="สำรองข้อมูลทั้งหมด — สร้างไฟล์ SQL dump"
        />

        {/* Alert */}
        {backupAlert && (
          <div className="mb-4">
            <AlertBox type={backupAlert.type} message={backupAlert.message} />
          </div>
        )}

        {/* Backup Now Button */}
        <button
          id="backup-now-btn"
          type="button"
          onClick={() => void handleBackupNow()}
          disabled={backupLoading}
          className={`${appBtnPrimaryClass} disabled:cursor-not-allowed disabled:opacity-60 mb-6`}
        >
          {backupLoading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
              กำลังสำรองข้อมูล…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Backup Now
            </>
          )}
        </button>

        {/* Backup History Table */}
        <div className="border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50/80 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-700/80">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Backup History</h3>
            <button
              type="button"
              id="refresh-snapshots-btn"
              onClick={() => void fetchSnapshots()}
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเฟรช
            </button>
          </div>

          {loadingSnapshots ? (
            <div className="flex items-center justify-center py-12 text-sm text-zinc-400">
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
              </svg>
              กำลังโหลด…
            </div>
          ) : snapshots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400 dark:text-zinc-600">
              <svg className="h-10 w-10 mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <p className="text-sm font-medium">ยังไม่มีข้อมูล Backup</p>
              <p className="text-xs mt-1">กด Backup Now เพื่อสร้างการสำรองข้อมูลแรก</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/30">
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Backup Name</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">วันที่</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">เวลา</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">ขนาด</th>
                    <th className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snap) => (
                    <SnapshotRow
                      key={snap.filename}
                      snapshot={snap}
                      onRestore={handleRestoreRequest}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================================================================
          SECTION 2 — RESTORE
      ================================================================ */}
      <div className={appCardClass} id="restore-section">
        <SectionHeader
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          title="Restore"
          description="กู้คืนข้อมูลจาก Backup — ข้อมูลทั้งหมดในระบบจะถูกแทนที่"
        />

        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-5 dark:bg-amber-950/30 dark:border-amber-800/50">
          <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
            การ Restore จะ Overwrite ข้อมูลทั้งหมดในระบบ — กรุณาตรวจสอบ Backup ที่ต้องการก่อนดำเนินการ
          </p>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
          เลือก Backup ที่ต้องการ Restore ได้จากตาราง Backup History ด้านบน โดยคลิกปุ่ม <strong>Restore</strong> ในแถวที่ต้องการ
        </p>

        {loadingSnapshots ? (
          <div className="text-sm text-zinc-400">กำลังโหลดรายการ Backup…</div>
        ) : snapshots.length === 0 ? (
          <div className="text-sm text-zinc-400">ไม่พบข้อมูล Backup สำหรับ Restore</div>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            มี <span className="font-semibold">{snapshots.length}</span> ไฟล์ Backup ในระบบ
          </p>
        )}
      </div>

      {/* ================================================================
          SECTION 3 — CLEAN DATA
      ================================================================ */}
      <div className={appCardClass} id="clean-data-section">
        <SectionHeader
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
          title="Clean Data"
          description="ล้างข้อมูลในระบบแบบเลือกหมวดหมู่ — ข้อมูลที่ลบจะไม่สามารถกู้คืนได้"
        />

        {cleanAlert && (
          <div className="mb-4">
            <AlertBox type={cleanAlert.type} message={cleanAlert.message} />
          </div>
        )}

        {/* Target Selection */}
        <div className="mb-5 space-y-2">
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-3">เลือกข้อมูลที่ต้องการลบ</p>
          {CLEAN_TARGETS.map((target) => {
            const isSelected = selectedTargets.has(target.key);
            return (
              <label
                key={target.key}
                htmlFor={`clean-target-${target.key}`}
                className={`flex items-start gap-3.5 rounded-xl border p-3.5 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? "border-red-300 bg-red-50/60 dark:border-red-700/60 dark:bg-red-950/20"
                    : "border-zinc-200/80 bg-zinc-50/40 hover:border-zinc-300 dark:border-zinc-700/80 dark:bg-zinc-800/20 dark:hover:border-zinc-600"
                }`}
              >
                <input
                  id={`clean-target-${target.key}`}
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => {
                    setSelectedTargets((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(target.key);
                      else next.delete(target.key);
                      return next;
                    });
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{target.label}</span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{target.description}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    {loadingStats ? "…" : (stats?.[target.key] ?? 0).toLocaleString()}
                  </span>
                  <p className="text-xs text-zinc-400">รายการ</p>
                </div>
              </label>
            );
          })}

          {/* Select All / Deselect All */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              id="select-all-targets-btn"
              onClick={() => setSelectedTargets(new Set(CLEAN_TARGETS.map((t) => t.key)))}
              className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition"
            >
              เลือกทั้งหมด
            </button>
            <span className="text-xs text-zinc-300 dark:text-zinc-600">|</span>
            <button
              type="button"
              id="deselect-all-targets-btn"
              onClick={() => setSelectedTargets(new Set())}
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium transition"
            >
              ล้างการเลือก
            </button>
          </div>
        </div>

        {/* Delete Button */}
        <button
          id="clean-data-btn"
          type="button"
          onClick={handleCleanRequest}
          disabled={selectedTargets.size === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-600/20 transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:focus:ring-offset-zinc-900"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          ลบข้อมูลที่เลือก
          {selectedTargets.size > 0 && <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-xs">{selectedTargets.size}</span>}
        </button>
      </div>

      {/* Confirmation Modal */}
      {confirmState && confirmModalProps && (
        <ConfirmModal
          {...confirmModalProps}
          isLoading={confirmState.isLoading}
          onConfirm={() => void handleConfirmAction()}
          onCancel={() => setConfirmState(null)}
        />
      )}
    </div>
  );
}
