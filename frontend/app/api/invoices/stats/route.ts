import { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyBackendJson(`/api/invoices/stats${query ? `?${query}` : ""}`, { method: "GET" });
}
