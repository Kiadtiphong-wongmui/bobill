import { NextRequest } from "next/server";

import { proxyBackendJson } from "@/lib/backend-proxy";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyBackendJson(`/api/quotations${query ? `?${query}` : ""}`, { method: "GET" });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyBackendJson("/api/quotations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
