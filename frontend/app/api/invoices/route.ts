import { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyBackendJson(`/api/invoices${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackendJson("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
