import type { BackupStats, CleanDataResult, CleanTarget, SnapshotInfo } from "./types";

const BASE = "/api/backup";

/** Creates a new backup (SQL dump). */
export async function createSnapshot(): Promise<SnapshotInfo> {
  const res = await fetch(`${BASE}/snapshots`, { method: "POST" });
  if (!res.ok) {
    const body = (await res.json()) as { message?: string };
    throw new Error(body.message ?? "ไม่สามารถสร้าง Backup ได้");
  }
  return res.json() as Promise<SnapshotInfo>;
}

/** Returns all backup snapshots sorted newest first. */
export async function listSnapshots(): Promise<SnapshotInfo[]> {
  const res = await fetch(`${BASE}/snapshots`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json()) as { message?: string };
    throw new Error(body.message ?? "ไม่สามารถดึงรายการ Backup ได้");
  }
  return res.json() as Promise<SnapshotInfo[]>;
}

/** Deletes a snapshot file by filename. */
export async function deleteSnapshot(filename: string): Promise<void> {
  const res = await fetch(`${BASE}/snapshots/${encodeURIComponent(filename)}`, { method: "DELETE" });
  if (res.status !== 204 && !res.ok) {
    const body = (await res.json()) as { message?: string };
    throw new Error(body.message ?? "ไม่สามารถลบ Backup ได้");
  }
}

/** Returns the URL for downloading a snapshot file. */
export function getSnapshotDownloadUrl(filename: string): string {
  return `${BASE}/snapshots/${encodeURIComponent(filename)}/download`;
}

/** Restores the database from a stored snapshot file. */
export async function restoreFromSnapshot(filename: string): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/restore/${encodeURIComponent(filename)}`, { method: "POST" });
  const body = (await res.json()) as { message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? "ไม่สามารถกู้คืนข้อมูลได้");
  }
  return { message: body.message ?? "กู้คืนข้อมูลสำเร็จ" };
}

/** Deletes selected data categories. */
export async function cleanData(targets: CleanTarget[]): Promise<CleanDataResult> {
  const res = await fetch(`${BASE}/clean`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ targets }),
  });
  const body = (await res.json()) as CleanDataResult & { message?: string };
  if (!res.ok) {
    throw new Error(body.message ?? "ไม่สามารถลบข้อมูลได้");
  }
  return body;
}

/** Returns the count of records per data category. */
export async function getBackupStats(): Promise<BackupStats> {
  const res = await fetch(`${BASE}/stats`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json()) as { message?: string };
    throw new Error(body.message ?? "ไม่สามารถดึงสถิติได้");
  }
  return res.json() as Promise<BackupStats>;
}
