import type { Request, Response } from "express";

/** Minimal placeholder controller for backup endpoints.
 *  Implement real logic later (pg_dump, prisma transactions, file I/O).
 */

export const backupController = {
  async snapshot(_req: Request, res: Response) {
    // Return minimal snapshot info placeholder
    return res.status(200).json({ json: { filename: "placeholder.json", createdAt: new Date().toISOString(), sizeBytes: 0 }, sql: null });
  },

  async listSnapshots(_req: Request, res: Response) {
    return res.status(200).json([]);
  },

  async downloadSnapshot(req: Request, res: Response) {
    const { filename } = req.params;
    return res.status(404).json({ message: `Snapshot not found: ${filename}` });
  },

  async deleteSnapshot(req: Request, res: Response) {
    const { filename } = req.params;
    return res.status(200).json({ message: `Deleted ${filename}` });
  },

  async restoreSnapshot(req: Request, res: Response) {
    const { filename } = req.params;
    return res.status(200).json({ message: `Restore requested for ${filename}` });
  },

  async restoreUpload(_req: Request, res: Response) {
    return res.status(200).json({ message: "Restore upload received" });
  },

  async clean(_req: Request, res: Response) {
    // Expect body { targets: string[] }
    const targets = (_req.body && (_req.body.targets || [])) as string[];
    const results: Record<string, number> = {};
    for (const t of targets) results[t] = 0;
    return res.status(200).json({ message: "Clean completed (placeholder)", results });
  },

  async stats(_req: Request, res: Response) {
    return res.status(200).json({ users: 0, invoices: 0, employee_cards: 0, upload_files: 0 });
  },
};
