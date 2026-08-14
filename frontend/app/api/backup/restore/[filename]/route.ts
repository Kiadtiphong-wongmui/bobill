import type { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

type Params = { params: Promise<{ filename: string }> };

/** POST /api/backup/restore/[filename] — Restore from a stored snapshot (JSON or SQL) */
export async function POST(_req: NextRequest, { params }: Params) {
  const { filename } = await params;
  return proxyBackendJson(`/api/backup/restore/${encodeURIComponent(filename)}`, { method: "POST" });
}
