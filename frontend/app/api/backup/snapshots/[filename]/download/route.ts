import type { NextRequest } from "next/server";

import { proxyBackendBinaryGet } from "@/lib/backend-proxy";

type Params = { params: Promise<{ filename: string }> };

/** GET /api/backup/snapshots/[filename]/download — Stream download a snapshot file */
export async function GET(_req: NextRequest, { params }: Params) {
  const { filename } = await params;
  return proxyBackendBinaryGet(`/api/backup/snapshots/${encodeURIComponent(filename)}/download`);
}
