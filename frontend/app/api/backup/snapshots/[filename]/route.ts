import type { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

type Params = { params: Promise<{ filename: string }> };

/** DELETE /api/backup/snapshots/[filename] — Delete a snapshot file */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { filename } = await params;
  return proxyBackendJson(`/api/backup/snapshots/${encodeURIComponent(filename)}`, { method: "DELETE" });
}
