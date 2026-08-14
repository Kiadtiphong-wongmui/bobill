/** Metadata for a single backup snapshot file */
export type SnapshotInfo = {
  filename: string;
  label: string;
  createdAt: string;
  sizeBytes: number;
  type: "sql";
};

/** Categories available for selective data cleanup */
export type CleanTarget = "users" | "invoices" | "employee_cards" | "upload_files";

/** Record count per data category returned by the stats endpoint */
export type BackupStats = Record<CleanTarget, number>;

/** Result from the clean data endpoint */
export type CleanDataResult = {
  message: string;
  results: BackupStats;
};
