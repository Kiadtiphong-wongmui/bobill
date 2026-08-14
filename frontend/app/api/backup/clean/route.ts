import type { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

/** POST /api/backup/clean — Delete selected data categories */
export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackendJson("/api/backup/clean", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
